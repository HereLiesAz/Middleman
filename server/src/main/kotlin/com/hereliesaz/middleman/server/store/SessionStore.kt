package com.hereliesaz.middleman.server.store

import com.hereliesaz.middleman.server.Session

/** Who a bearer token belongs to. */
data class Principal(val sessionId: String, val participantId: String)

/**
 * Persistence boundary. [update] is atomic per session: the transform sees the latest state and no
 * concurrent update for the same session interleaves. [delete] removes the session, its device index
 * and every token issued for it. Nothing is archived.
 */
interface SessionStore {
    suspend fun create(session: Session)
    suspend fun get(id: String): Session?
    suspend fun findByInvite(code: String): Session?
    suspend fun <T> update(id: String, transform: suspend (Session) -> Pair<Session, T>): T
    suspend fun delete(id: String)
    /** Ids of live sessions that include every one of [deviceIds]. */
    suspend fun sessionsWithAll(deviceIds: Set<String>): List<String>
    suspend fun expiredBefore(now: Long): List<String>
    suspend fun issueToken(principal: Principal): String
    suspend fun resolve(token: String): Principal?
}
