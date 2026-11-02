package com.hereliesaz.middleman.api

import com.hereliesaz.middleman.model.SessionView
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.HttpResponseValidator
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.client.plugins.websocket.webSocket
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.serialization.kotlinx.json.json
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.serialization.json.Json

class MiddlemanException(message: String) : Exception(message)

val MiddlemanJson = Json { ignoreUnknownKeys = true; encodeDefaults = true; explicitNulls = false }

/** Typed client for the Middleman server. Holds no state beyond the base URL. */
class MiddlemanClient(private val baseUrl: String, engine: HttpClient = HttpClient()) {
    private val wsBase = baseUrl.trimEnd('/').replaceFirst(Regex("^http"), "ws")

    private val http = engine.config {
        expectSuccess = false
        install(ContentNegotiation) { json(MiddlemanJson) }
        install(WebSockets)
        defaultRequest { url(baseUrl.trimEnd('/') + "/") }
        HttpResponseValidator {
            validateResponse { r ->
                // 101 is the WebSocket handshake succeeding, not an error.
                if (!r.status.isSuccess() && r.status != HttpStatusCode.SwitchingProtocols) {
                    val msg = runCatching { r.body<ApiError>().error }.getOrNull() ?: r.status.description
                    throw MiddlemanException(msg)
                }
            }
        }
    }

    suspend fun create(title: String, name: String): Credentials =
        http.post(Routes.SESSIONS.drop(1)) { json(CreateSessionRequest(title, name)) }.body()

    suspend fun join(inviteCode: String, name: String): Credentials =
        http.post(Routes.JOIN.drop(1)) { json(JoinSessionRequest(inviteCode, name)) }.body()

    suspend fun session(token: String): SessionView = http.get(Routes.ME.drop(1)) { bearerAuth(token) }.body()

    suspend fun sayPrivately(token: String, text: String): SessionView = post(Routes.PRIVATE, token, SayRequest(text))
    suspend fun sayToEveryone(token: String, text: String): SessionView = post(Routes.JOINT, token, SayRequest(text))
    suspend fun bridge(token: String, messageId: String): SessionView = post(Routes.BRIDGE, token, BridgeRequest(messageId))
    suspend fun timeout(token: String): SessionView = http.post(Routes.TIMEOUT.drop(1)) { bearerAuth(token) }.body()

    /** Live session updates. Emits a fresh [SessionView] whenever anything visible to you changes. */
    fun stream(token: String): Flow<SessionView> = flow {
        http.webSocket(urlString = "$wsBase${Routes.STREAM}?token=$token") {
            for (frame in incoming) {
                if (frame is Frame.Text) emit(MiddlemanJson.decodeFromString(SessionView.serializer(), frame.readText()))
            }
        }
    }

    private suspend inline fun <reified T : Any> post(route: String, token: String, body: T): SessionView =
        http.post(route.drop(1)) { bearerAuth(token); json(body) }.body()

    private inline fun <reified T : Any> io.ktor.client.request.HttpRequestBuilder.json(body: T) {
        contentType(ContentType.Application.Json)
        setBody(body)
    }
}
