package com.hereliesaz.middleman.model

import kotlinx.serialization.Serializable

/**
 * A person in a mediation. A session has two or more; there is no "partner A / B".
 * Two is the minimum number of people it takes to fight. There is no maximum.
 */
@Serializable
data class Participant(
    val id: String,
    val name: String,
    val joinedAt: Long,
)

/**
 * One utterance in a room.
 *
 * @property authorId the participant who wrote it, or `null` when Middleman speaks.
 * @property onBehalfOf set when Middleman relays a consented, reframed bridge for a participant.
 * @property visibleTo when non-null, only this participant may ever see the message. Used for
 *   joint-room messages that Middleman held back, and for the private coaching that follows them.
 * @property held the author's words were stopped before reaching anyone else.
 */
@Serializable
data class Message(
    val id: String,
    val authorId: String?,
    val text: String,
    val sentAt: Long,
    val insight: Insight? = null,
    val alerts: List<CleanFightRule> = emptyList(),
    val onBehalfOf: String? = null,
    val visibleTo: String? = null,
    val held: Boolean = false,
    val bridged: Boolean = false,
)

/** The two layers of every fight: what it's about, and what it's actually about. */
@Serializable
data class ContentVsFeelings(val content: String, val feelings: String)

/** Care, then the hard truth, then the reason you're bothering to say it. */
@Serializable
data class IntentSandwich(val anchorOfCare: String, val vulnerableTruth: String, val reassurance: String)

/**
 * Middleman's contrastruction of a private statement. Never leaves the speaker's room,
 * except [bridge], and only when the speaker explicitly asks for it to be delivered.
 */
@Serializable
data class Insight(
    val validation: String,
    val misinterpretation: String,
    val areaOfContrast: String,
    val commonGround: String,
    val underlyingNeed: String,
    val layers: ContentVsFeelings,
    val sandwich: IntentSandwich,
    val clarifyingQuestion: String,
    val bridge: String? = null,
)

/** How close the room is to being safe for everyone at once. All values 0–100. */
@Serializable
data class Readiness(
    val deescalation: Int,
    val empathy: Int,
    val sharedGoals: Int,
    val score: Int,
    val ready: Boolean,
    val summary: String,
) {
    companion object {
        const val THRESHOLD = 70
        val EMPTY = Readiness(10, 10, 10, 10, false, "Waiting for everyone to arrive.")
    }
}

/** A breathing pause someone called. Nobody may post to the joint room until it ends. */
@Serializable
data class Timeout(val calledBy: String, val endsAt: Long)

/**
 * Everything one participant is allowed to know about a session. The server builds this per
 * viewer; other participants' private rooms and needs are never included.
 */
@Serializable
data class SessionView(
    val sessionId: String,
    val title: String,
    val inviteCode: String,
    val you: Participant,
    val participants: List<Participant>,
    val privateRoom: List<Message>,
    val jointRoom: List<Message>,
    val yourNeeds: List<String>,
    val commonGround: List<String>,
    val readiness: Readiness,
    val jointUnlocked: Boolean,
    val timeout: Timeout? = null,
)
