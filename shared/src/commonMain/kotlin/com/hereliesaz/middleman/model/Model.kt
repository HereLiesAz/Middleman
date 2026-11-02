package com.hereliesaz.middleman.model

import kotlinx.serialization.Serializable

/**
 * A person in a mediation. Two is the minimum number of people it takes to fight; there is no maximum.
 * The one who started it asked for space: "talk to me through Middleman until you can be respectful."
 */
@Serializable
data class Participant(
    val id: String,
    val name: String,
    val joinedAt: Long,
)

/**
 * One line in someone's room. Every participant has exactly one room, shared only with Middleman.
 *
 * @property authorId who wrote it; `null` when Middleman speaks.
 * @property relayFrom set on Middleman's messages that carry someone else's words, paraphrased.
 * @property deliveredAs on your own message: what Middleman actually told the others.
 * @property withheld on your own message: why nothing from it was passed on.
 */
@Serializable
data class Message(
    val id: String,
    val authorId: String?,
    val text: String,
    val sentAt: Long,
    val insight: Insight? = null,
    val alerts: List<CleanFightRule> = emptyList(),
    val relayFrom: String? = null,
    val deliveredAs: String? = null,
    val withheld: String? = null,
)

/** The two layers of every fight: what it's about, and what it's actually about. */
@Serializable
data class ContentVsFeelings(val content: String, val feelings: String)

/** Care, then the hard truth, then the reason you're bothering to say it. */
@Serializable
data class IntentSandwich(val anchorOfCare: String, val vulnerableTruth: String, val reassurance: String)

/** Middleman's contrastruction of a private statement. Never leaves the speaker's room. */
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
)

@Serializable
enum class EndReason { RESOLVED, EXPIRED, REPLACED }

/** The last thing a session says before it is deleted. */
@Serializable
data class Ending(val reason: EndReason, val note: String)

/**
 * Everything one participant may know about a session. Built per viewer by the server; nobody
 * else's room is ever included. When [ending] is set, this is the final frame: the session no
 * longer exists on the server.
 */
@Serializable
data class SessionView(
    val sessionId: String,
    val title: String,
    val inviteCode: String,
    val link: String,
    val starterId: String,
    val you: Participant,
    val participants: List<Participant>,
    val room: List<Message>,
    val expiresAt: Long? = null,
    val ending: Ending? = null,
)
