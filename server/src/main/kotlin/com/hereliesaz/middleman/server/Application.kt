package com.hereliesaz.middleman.server

import com.anthropic.models.messages.OutputConfig
import com.hereliesaz.middleman.api.MiddlemanJson
import com.hereliesaz.middleman.server.mediation.ClaudeClient
import com.hereliesaz.middleman.server.mediation.FallbackMediator
import com.hereliesaz.middleman.server.mediation.GeminiClient
import com.hereliesaz.middleman.server.mediation.HeuristicMediator
import com.hereliesaz.middleman.server.mediation.LlmMediator
import com.hereliesaz.middleman.server.mediation.Mediator
import com.hereliesaz.middleman.server.store.SessionStore
import com.hereliesaz.middleman.server.store.SqliteSessionStore
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation as ClientContentNegotiation
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.calllogging.CallLogging
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import io.ktor.server.routing.routing
import io.ktor.server.websocket.WebSockets
import io.ktor.server.websocket.pingPeriod
import org.slf4j.LoggerFactory
import java.io.File
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.time.Duration.Companion.seconds

/**
 * Configuration, all from the environment:
 *
 * | Variable            | Default            | Meaning                                         |
 * |---------------------|--------------------|-------------------------------------------------|
 * | `PORT`              | `8080`             | HTTP port                                       |
 * | `MIDDLEMAN_DB`      | `data/middleman.db`| SQLite file                                     |
 * | `MEDIATOR`          | `heuristic`        | `heuristic`, `gemini`, or `claude`              |
 * | `GEMINI_API_KEY`    |                    | required for `gemini`                           |
 * | `GEMINI_MODEL`      | `gemini-3.8-flash` |                                                 |
 * | `ANTHROPIC_API_KEY` |                    | required for `claude`                           |
 * | `CLAUDE_MODEL`      | `claude-opus-5-5`  |                                                 |
 * | `CLAUDE_EFFORT`     | `medium`           | `low`, `medium`, `high`, `xhigh`, `max`         |
 * | `CORS_ORIGINS`      | `*`                | comma-separated origins allowed for the web app |
 * | `PUBLIC_URL`        | `https://middleman.hereliesaz.com` | base of shareable invite links      |
 * | `WEB_ROOT`          |                    | directory of the built web app to serve           |
 * | `ANDROID_CERT_SHA256` |                  | comma-separated signing-cert fingerprints for App Links |
 * | `APPLE_APP_IDS`     |                    | comma-separated `TEAMID.bundleid` for iOS universal links |
 */
fun main() {
    val env = System.getenv()
    val dbPath = env["MIDDLEMAN_DB"] ?: "data/middleman.db"
    File(dbPath).absoluteFile.parentFile.mkdirs()
    val store = SqliteSessionStore(dbPath)
    val mediator = mediatorFrom(env)
    LoggerFactory.getLogger("Middleman").info("Mediator: ${mediator.name}. Store: $dbPath")
    val service = MediationService(store, mediator, env["PUBLIC_URL"] ?: "https://middleman.hereliesaz.com")
    embeddedServer(Netty, port = env["PORT"]?.toInt() ?: 8080) {
        middleman(
            store, service,
            corsOrigins = env["CORS_ORIGINS"],
            webRoot = env["WEB_ROOT"]?.let(::File)?.takeIf { it.isDirectory },
            androidCertSha256 = env["ANDROID_CERT_SHA256"]?.split(',')?.map(String::trim)?.filter(String::isNotEmpty).orEmpty(),
            appleAppIds = env["APPLE_APP_IDS"]?.split(',')?.map(String::trim)?.filter(String::isNotEmpty).orEmpty(),
        )
        // Expiry is a promise to delete; keep it even when nobody is looking.
        launch { while (true) { runCatching { service.sweepExpired() }; delay(60_000) } }
    }.start(wait = true)
}

fun mediatorFrom(env: Map<String, String>): Mediator {
    fun key(name: String) = env[name]?.takeIf { it.isNotBlank() } ?: error("MEDIATOR needs $name")
    val llm = when (env["MEDIATOR"]?.lowercase() ?: "heuristic") {
        "heuristic" -> return HeuristicMediator
        "gemini" -> GeminiClient(
            HttpClient(CIO) { install(ClientContentNegotiation) { json(MiddlemanJson) } },
            key("GEMINI_API_KEY"),
            env["GEMINI_MODEL"] ?: "gemini-3.8-flash",
        )
        "claude" -> ClaudeClient(
            key("ANTHROPIC_API_KEY"),
            env["CLAUDE_MODEL"] ?: "claude-opus-5-5",
            OutputConfig.Effort.of(env["CLAUDE_EFFORT"] ?: "medium"),
        )
        else -> error("Unknown MEDIATOR '${env["MEDIATOR"]}'")
    }
    return FallbackMediator(LlmMediator(llm))
}

fun Application.middleman(
    store: SessionStore,
    service: MediationService,
    corsOrigins: String? = null,
    webRoot: File? = null,
    androidCertSha256: List<String> = emptyList(),
    appleAppIds: List<String> = emptyList(),
) {
    install(ContentNegotiation) { json(MiddlemanJson) }
    install(WebSockets) { pingPeriod = 20.seconds }
    install(CallLogging)
    install(CORS) {
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)
        allowMethod(HttpMethod.Post)
        val origins = corsOrigins?.split(',')?.map(String::trim)?.filter(String::isNotEmpty).orEmpty()
        if (origins.isEmpty()) anyHost() else origins.forEach { allowHost(it.substringAfter("://"), listOf(it.substringBefore("://"))) }
    }
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            val (status, body) = errorFor(cause)
            if (status.value >= 500) this@middleman.environment.log.error("Unhandled", cause)
            call.respond(status, body)
        }
    }
    routing {
        middlemanRoutes(service, store)
        webRoutes(webRoot, androidCertSha256, appleAppIds)
    }
}
