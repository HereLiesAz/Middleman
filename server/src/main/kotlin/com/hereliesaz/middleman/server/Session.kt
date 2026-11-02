package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.model.Ending
import com.hereliesaz.middleman.model.Message
import com.hereliesaz.middleman.model.Participant
import com.hereliesaz.middleman.model.SessionView
import kotlinx.serialization.Serializable

/**
 * The whole truth of a session. Lives only on the server, and only until resolution, expiry, or
 * replacement; then it is deleted. Clients receive [viewFor] output, never this object.
 *
 * @property devices participant id → the anonymous device id they joined from. Server-only; used to
 *   recognize "the same people" across sessions.
 */
@Serializable
data class Session(
    val id: String,
    val title: String,
    val inviteCode: String,
    val createdAt: Long,
    val starterId: String,
    val expiresAt: Long? = null,
    val participants: List<Participant> = emptyList(),
    val devices: Map<String, String> = emptyMap(),
    val rooms: Map<String, List<Message>> = emptyMap(),
    val needs: Map<String, List<String>> = emptyMap(),
    val perspectives: Map<String, String> = emptyMap(),
    val commonGround: List<String> = emptyList(),
) {
    fun participant(id: String): Participant = participants.first { it.id == id }
    fun others(id: String): List<Participant> = participants.filter { it.id != id }
    fun room(id: String): List<Message> = rooms[id].orEmpty()
    fun withMessage(roomOf: String, m: Message) = copy(rooms = rooms + (roomOf to room(roomOf) + m))

    /** Everything this viewer may see, and nothing anyone said to Middleman in another room. */
    fun viewFor(viewerId: String, publicBaseUrl: String, ending: Ending? = null): SessionView = SessionView(
        sessionId = id,
        title = title,
        inviteCode = inviteCode,
        link = publicBaseUrl.trimEnd('/') + "/j/" + inviteCode,
        starterId = starterId,
        you = participant(viewerId),
        participants = participants,
        room = room(viewerId),
        expiresAt = expiresAt,
        ending = ending,
    )
}
