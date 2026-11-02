package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.model.Message
import com.hereliesaz.middleman.model.Participant
import com.hereliesaz.middleman.model.Readiness
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.model.Timeout
import com.hereliesaz.middleman.rules.ReadinessCalculator
import kotlinx.serialization.Serializable

/**
 * The whole truth of a session. Lives only on the server. Clients receive [viewFor] output,
 * never this object — that boundary is the product.
 */
@Serializable
data class Session(
    val id: String,
    val title: String,
    val inviteCode: String,
    val createdAt: Long,
    val participants: List<Participant> = emptyList(),
    val privateRooms: Map<String, List<Message>> = emptyMap(),
    val jointRoom: List<Message> = emptyList(),
    val needs: Map<String, List<String>> = emptyMap(),
    val perspectives: Map<String, String> = emptyMap(),
    val commonGround: List<String> = emptyList(),
    val jointUnlocked: Boolean = false,
    val timeout: Timeout? = null,
) {
    fun participant(id: String): Participant = participants.first { it.id == id }
    fun others(id: String): List<Participant> = participants.filter { it.id != id }
    fun room(id: String): List<Message> = privateRooms[id].orEmpty()

    fun readiness(): Readiness = ReadinessCalculator.score(
        participants.map { p ->
            ReadinessCalculator.Input(p, room(p.id).filter { it.authorId == p.id }.map { it.text }, needs[p.id].orEmpty())
        },
        commonGround,
    )

    fun activeTimeout(now: Long): Timeout? = timeout?.takeIf { it.endsAt > now }

    /** Sanitize for one viewer: their room, the joint room minus anything held for someone else. */
    fun viewFor(viewerId: String, now: Long): SessionView = SessionView(
        sessionId = id,
        title = title,
        inviteCode = inviteCode,
        you = participant(viewerId),
        participants = participants,
        privateRoom = room(viewerId),
        jointRoom = jointRoom.filter { it.visibleTo == null || it.visibleTo == viewerId },
        yourNeeds = needs[viewerId].orEmpty(),
        commonGround = commonGround,
        readiness = readiness(),
        jointUnlocked = jointUnlocked,
        timeout = activeTimeout(now),
    )
}
