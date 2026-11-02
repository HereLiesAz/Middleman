package com.hereliesaz.middleman.api

import kotlinx.serialization.Serializable

/** Wire contract between apps and server. Every authenticated call carries `Authorization: Bearer <token>`. */
object Routes {
    const val SESSIONS = "/api/sessions"
    const val JOIN = "/api/sessions/join"
    const val ME = "/api/me"
    const val PRIVATE = "/api/me/private"
    const val JOINT = "/api/me/joint"
    const val BRIDGE = "/api/me/bridge"
    const val TIMEOUT = "/api/me/timeout"
    const val STREAM = "/api/me/stream"
}

@Serializable data class CreateSessionRequest(val title: String, val name: String)
@Serializable data class JoinSessionRequest(val inviteCode: String, val name: String)
@Serializable data class Credentials(val token: String, val sessionId: String, val participantId: String)
@Serializable data class SayRequest(val text: String)
@Serializable data class BridgeRequest(val messageId: String)
@Serializable data class ApiError(val error: String)
