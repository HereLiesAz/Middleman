package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.api.ApiError
import com.hereliesaz.middleman.api.CreateSessionRequest
import com.hereliesaz.middleman.api.Credentials
import com.hereliesaz.middleman.api.JoinSessionRequest
import com.hereliesaz.middleman.api.MiddlemanJson
import com.hereliesaz.middleman.api.Routes
import com.hereliesaz.middleman.api.SayRequest
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.server.store.Principal
import com.hereliesaz.middleman.server.store.SessionStore
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.http.content.staticFiles
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondFile
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.takeWhile
import java.io.File

class Unauthorized : Exception("Not signed in to a mediation.")

fun Route.middlemanRoutes(service: MediationService, store: SessionStore) {
    suspend fun ApplicationCall.principal(): Principal {
        val token = request.headers["Authorization"]?.removePrefix("Bearer ")?.trim() ?: throw Unauthorized()
        return store.resolve(token) ?: throw Unauthorized()
    }

    get("/health") { call.respond(mapOf("status" to "ok")) }

    post(Routes.SESSIONS) {
        val r = call.receive<CreateSessionRequest>()
        val (p, token) = service.create(r.title, r.name, r.deviceId, r.expiryDays)
        call.respond(HttpStatusCode.Created, Credentials(token, p.sessionId, p.participantId))
    }
    post(Routes.JOIN) {
        val r = call.receive<JoinSessionRequest>()
        val (p, token) = service.join(r.inviteCode, r.name, r.deviceId)
        call.respond(Credentials(token, p.sessionId, p.participantId))
    }
    get(Routes.ME) { call.respond(service.view(call.principal())) }
    post(Routes.SAY) { call.respond(service.say(call.principal(), call.receive<SayRequest>().text)) }

    // Browsers can't set headers on WebSockets, so the token rides the query string here only.
    webSocket(Routes.STREAM) {
        val principal = call.request.queryParameters["token"]?.let { store.resolve(it) }
            ?: return@webSocket close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Not signed in."))
        var ended = false
        service.changes
            .onStart { emit(Change(principal.sessionId)) }
            .filter { it.sessionId == principal.sessionId }
            .takeWhile { !ended }
            .collect { change ->
                val view = change.finals?.get(principal.participantId)?.also { ended = true } ?: service.view(principal)
                send(Frame.Text(MiddlemanJson.encodeToString(SessionView.serializer(), view)))
                if (ended) close(CloseReason(CloseReason.Codes.NORMAL, "Mediation ended."))
            }
    }
}

/**
 * Invite links and the web app. `/j/<code>` serves the web app, which reads the code from its own
 * URL; on Android the same link opens the installed app, verified by `assetlinks.json`.
 */
fun Route.webRoutes(webRoot: File?, androidCertSha256: List<String>) {
    get("/.well-known/assetlinks.json") {
        val fingerprints = androidCertSha256.joinToString(",") { "\"$it\"" }
        call.respondText(
            """[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"com.hereliesaz.middleman","sha256_cert_fingerprints":[$fingerprints]}}]""",
            ContentType.Application.Json,
        )
    }
    if (webRoot == null) return
    get("${Routes.INVITE_PREFIX}{code}") { call.respondFile(File(webRoot, "index.html")) }
    staticFiles("/", webRoot) { default("index.html") }
}

fun errorFor(cause: Throwable): Pair<HttpStatusCode, ApiError> = when (cause) {
    is Unauthorized -> HttpStatusCode.Unauthorized to ApiError(cause.message!!)
    is NoSuchElementException -> HttpStatusCode.NotFound to ApiError(cause.message ?: "Not found.")
    is IllegalArgumentException -> HttpStatusCode.BadRequest to ApiError(cause.message ?: "Bad request.")
    is io.ktor.server.plugins.BadRequestException -> HttpStatusCode.BadRequest to ApiError("Bad request.")
    else -> HttpStatusCode.InternalServerError to ApiError("Middleman stumbled. Try again.")
}
