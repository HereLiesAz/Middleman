package com.hereliesaz.middleman.model

import kotlinx.serialization.Serializable

/**
 * Ze Frank's rules of engagement ("How to Fight as a Couple"), plus contempt.
 * [holds] rules stop a joint-room message before it reaches anyone; the rest only annotate.
 */
@Serializable
enum class CleanFightRule(val holds: Boolean, val note: String) {
    GENERALIZATION(
        holds = false,
        note = "\"Always\" and \"never\" turn one moment into a verdict on a whole person.",
    ),
    WEAPONIZED_LANGUAGE(
        holds = true,
        note = "Swear at the problem, not at the person.",
    ),
    RELATIONSHIP_THREAT(
        holds = true,
        note = "Threatening to leave is a hostage, not an argument.",
    ),
    CONTEMPT(
        holds = true,
        note = "Character verdicts end conversations. Describe what happened, not what they are.",
    ),
    PAST_BATTLES(
        holds = false,
        note = "Fight the fight you're in. Old wars make proxies of everyone.",
    ),
}
