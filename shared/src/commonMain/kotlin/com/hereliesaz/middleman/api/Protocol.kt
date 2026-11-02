package com.hereliesaz.middleman.api

import kotlinx.serialization.Serializable

/** Wire contract between apps and server. Authenticated calls carry `Authorization: Bearer <token>`. */
object Routes {
    const val SESSIONS = "/api/sessions"
    const val JOIN = "/api/sessions/join"
    const val ME = "/api/me"
    const val SAY = "/api/me/say"
    const val STREAM = "/api/me/stream"
    /** Shareable invite links: `https://<host>/j/<code>`. */
    const val INVITE_PREFIX = "/j/"
}

/**
 * @property deviceId a random id the app generates once and keeps. It is how Middleman knows that a
 *   new mediation is "between the same people" and the old one should be deleted.
 * @property expiryDays optional lifetime; the session is deleted if it hasn't resolved by then.
 */
@Serializable data class CreateSessionRequest(val title: String, val name: String, val deviceId: String, val expiryDays: Int? = null)
@Serializable data class JoinSessionRequest(val inviteCode: String, val name: String, val deviceId: String)
@Serializable data class Credentials(val token: String, val sessionId: String, val participantId: String)
@Serializable data class SayRequest(val text: String)
@Serializable data class ApiError(val error: String)

/** Extracts an invite code from a pasted link or a bare code. */
fun inviteCodeFrom(input: String): String? =
    input.trim().substringAfterLast(Routes.INVITE_PREFIX).trimEnd('/').uppercase().filter(Char::isLetterOrDigit).takeIf { it.length == 6 }
