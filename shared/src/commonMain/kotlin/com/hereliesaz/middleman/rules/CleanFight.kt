package com.hereliesaz.middleman.rules

import com.hereliesaz.middleman.model.CleanFightRule
import com.hereliesaz.middleman.model.CleanFightRule.*

/** Detects violations of [CleanFightRule]s. Deterministic, offline, same on every platform. */
object CleanFight {
    private fun words(vararg w: String) = Regex("\\b(${w.joinToString("|")})\\b", RegexOption.IGNORE_CASE)

    private val patterns: Map<CleanFightRule, Regex> = linkedMapOf(
        GENERALIZATION to words("always", "never", "every single time", "constantly", "without fail"),
        WEAPONIZED_LANGUAGE to words(
            "fuck(ing)?", "f\\*cking", "bitch", "bastard", "asshole", "dipshit",
            "moron", "piece of shit", "stupid", "idiot",
        ),
        RELATIONSHIP_THREAT to words(
            "break up", "divorce", "leaving you", "leave you", "walk out", "done with this",
            "done with you", "shouldn't be together", "call it quits",
        ),
        CONTEMPT to words(
            "selfish", "worthless", "pathetic", "manipulative", "shut up",
            "you don'?t care", "it'?s all your fault", "you ruined",
        ),
        PAST_BATTLES to words("last time you", "remember when you", "your ex", "just like (your|you did)", "same thing you did"),
    )

    /** Every rule [text] breaks, in declaration order. */
    fun check(text: String): List<CleanFightRule> = patterns.filterValues { it.containsMatchIn(text) }.keys.toList()

    /** True when [text] should never reach another participant unedited. */
    fun shouldHold(text: String): Boolean = check(text).any { it.holds }

    /** The first offending phrase, for quoting back gently. */
    fun firstTrigger(text: String): String? =
        patterns.values.firstNotNullOfOrNull { it.find(text)?.value }
}
