package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.api.ApiError
import com.hereliesaz.middleman.api.BridgeRequest
import com.hereliesaz.middleman.api.CreateSessionRequest
import com.hereliesaz.middleman.api.Credentials
import com.hereliesaz.middleman.api.JoinSessionRequest
import com.hereliesaz.middleman.api.MiddlemanJson
import com.hereliesaz.middleman.api.Routes
import com.hereliesaz.middleman.api.SayRequest
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.server.store.Principal
import com.hereliesaz.middleman.server.store.SessionStore
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.onStart

class Unauthorized : Exception("Not signed in to a mediation.")

fun Route.middlemanRoutes(service: MediationService, store: SessionStore) {
    suspend fun ApplicationCall.principal(): Principal {
        val token = request.headers["Authorization"]?.removePrefix("Bearer ")?.trim() ?: throw Unauthorized()
        return store.resolve(token) ?: throw Unauthorized()
    }

    get("/health") { call.respond(mapOf("status" to "ok")) }

    post(Routes.SESSIONS) {
        val req = call.receive<CreateSessionRequest>()
        val (p, token) = service.create(req.title, req.name)
        call.respond(HttpStatusCode.Created, Credentials(token, p.sessionId, p.participantId))
    }
    post(Routes.JOIN) {
        val req = call.receive<JoinSessionRequest>()
        val (p, token) = service.join(req.inviteCode, req.name)
        call.respond(Credentials(token, p.sessionId, p.participantId))
    }
    get(Routes.ME) { call.respond(service.view(call.principal())) }
    post(Routes.PRIVATE) { call.respond(service.sayPrivately(call.principal(), call.receive<SayRequest>().text)) }
    post(Routes.JOINT) { call.respond(service.sayToEveryone(call.principal(), call.receive<SayRequest>().text)) }
    post(Routes.BRIDGE) { call.respond(service.bridge(call.principal(), call.receive<BridgeRequest>().messageId)) }
    post(Routes.TIMEOUT) { call.respond(service.timeout(call.principal())) }

    // Browsers can't set headers on WebSockets, so the token rides the query string here only.
    webSocket(Routes.STREAM) {
        val principal = call.request.queryParameters["token"]?.let { store.resolve(it) }
            ?: return@webSocket close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Not signed in."))
        service.changes
            .onStart { emit(principal.sessionId) }
            .filter { it == principal.sessionId }
            .collect { send(Frame.Text(MiddlemanJson.encodeToString(SessionView.serializer(), service.view(principal)))) }
    }
}

fun errorFor(cause: Throwable): Pair<HttpStatusCode, ApiError> = when (cause) {
    is Unauthorized -> HttpStatusCode.Unauthorized to ApiError(cause.message!!)
    is NoSuchElementException -> HttpStatusCode.NotFound to ApiError(cause.message ?: "Not found.")
    is IllegalArgumentException -> HttpStatusCode.BadRequest to ApiError(cause.message ?: "Bad request.")
    is RoomRuleException -> HttpStatusCode.Conflict to ApiError(cause.message!!)
    else -> HttpStatusCode.InternalServerError to ApiError("Middleman stumbled. Try again.")
}
