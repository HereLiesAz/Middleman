package com.hereliesaz.middleman.rules

import com.hereliesaz.middleman.model.Participant
import com.hereliesaz.middleman.model.Readiness

/**
 * Scores whether a group is ready to speak directly. Generalized from the original two-partner
 * formula so that two participants score exactly as before, and N participants share the weight.
 *
 * - De-escalation (35%): conversational depth, minus a penalty for recent friction.
 * - Empathy (40%): each participant contributes up to 100/N for their first two named needs.
 * - Shared goals (25%): common ground found across everyone.
 *
 * Unlocks only when everyone has spoken at least twice, everyone has a named need, and the
 * composite reaches [Readiness.THRESHOLD].
 */
object ReadinessCalculator {
    data class Input(
        val participant: Participant,
        val ownMessages: List<String>,
        val needs: List<String>,
    )

    fun score(inputs: List<Input>, commonGround: List<String>): Readiness {
        val n = inputs.size
        if (n < 2) return Readiness.EMPTY

        val total = inputs.sumOf { it.ownMessages.size }
        val depth = minOf(100.0, total * 12.0 * 2 / n)
        val recentFriction = inputs.flatMap { it.ownMessages.takeLast(2) }.any { CleanFight.check(it).isNotEmpty() }
        val deescalation = (depth - (if (recentFriction) 15 else 0) + 20).toInt().coerceIn(10, 100)

        val empathy = inputs.sumOf { minOf(it.needs.size, 2) * 50.0 / n }.toInt().coerceIn(10, 100)
        val sharedGoals = (commonGround.size * 35).coerceIn(10, 100)

        val score = (deescalation * 0.35 + empathy * 0.40 + sharedGoals * 0.25).toInt().coerceIn(5, 100)
        val ready = score >= Readiness.THRESHOLD && inputs.all { it.ownMessages.size >= 2 && it.needs.isNotEmpty() }

        return Readiness(deescalation, empathy, sharedGoals, score, ready, summarize(inputs, ready))
    }

    private fun summarize(inputs: List<Input>, ready: Boolean): String {
        if (ready) return "Everyone has been heard and their needs named. The joint room is safe to open."
        val most = inputs.maxOf { it.ownMessages.size }
        val quiet = inputs.filter { it.ownMessages.size < most || it.ownMessages.isEmpty() }.map { it.participant.name }
        return when {
            inputs.all { it.ownMessages.isEmpty() } -> "Everyone is in their own room. Nobody has spoken yet."
            quiet.isNotEmpty() -> "Waiting to hear more from ${quiet.joinedNaturally()}, so every side is heard equally."
            inputs.any { it.needs.isEmpty() } -> "Needs are surfacing. Middleman is still listening privately."
            else -> "Everyone is talking. Common ground is still being built."
        }
    }
}

/** "A", "A and B", "A, B and C". */
fun List<String>.joinedNaturally(): String = when (size) {
    0 -> ""
    1 -> first()
    else -> dropLast(1).joinToString(", ") + " and " + last()
}
