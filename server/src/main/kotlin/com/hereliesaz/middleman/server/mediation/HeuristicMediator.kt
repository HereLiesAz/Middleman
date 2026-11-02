package com.hereliesaz.middleman.server.mediation

import com.hereliesaz.middleman.model.ContentVsFeelings
import com.hereliesaz.middleman.model.Insight
import com.hereliesaz.middleman.model.IntentSandwich
import com.hereliesaz.middleman.rules.CleanFight
import com.hereliesaz.middleman.rules.joinedNaturally

/**
 * Offline mediator. Pattern-matches the common shapes of a fight (labor, distance, time) into
 * contrastruction templates. Always available; the floor under every LLM provider.
 */
object HeuristicMediator : Mediator {
    override val name = "heuristic"

    private class Theme(
        val triggers: List<String>,
        val need: String,
        val contrast: (String, String) -> String,
        val ground: (String, String) -> String,
        val layers: ContentVsFeelings,
        val truth: String,
        /** A paraphrase safe to carry to the others, in the speaker's voice. */
        val bridge: String,
    )

    private val themes = listOf(
        Theme(
            listOf("help", "chore", "dish", "clean", "housework", "around the house", "trash", "laundry", "team"),
            need = "Partnership, and not carrying the daily weight alone",
            contrast = { s, o -> "$s experiences undone tasks as an invisible, lonely burden; $o may hear requests as criticism they can't win." },
            ground = { s, o -> "$s and $o both want a home that feels like a team, not a workplace with a supervisor." },
            layers = ContentVsFeelings("Who does which chores, and when.", "Exhaustion, and feeling unseen inside your own home."),
            truth = "carrying this alone has left me drained and further from you than I want to be",
            bridge = "I want us to feel like teammates again, because doing it alone is wearing me down.",
        ),
        Theme(
            listOf("ignore", "listen", "dismiss", "silent", "quiet", "text back", "respond"),
            need = "Presence, and evidence that what they say lands",
            contrast = { s, o -> "$s reads silence as withdrawal; $o may go quiet to keep from saying something worse." },
            ground = { s, o -> "$s and $o both want closeness. Conflict just sends one of you toward the other and the other toward cover." },
            layers = ContentVsFeelings("Response time and conversational pacing.", "Fear that silence means the warmth is gone."),
            truth = "when things go quiet I panic that I've lost you",
            bridge = "When it goes quiet between us I feel disconnected, and I want to find a rhythm that feels safe for both of us.",
        ),
        Theme(
            listOf("work", "job", "late", "forgot", "priority", "anniversary", "birthday", "time", "busy", "layoff", "money", "mortgage"),
            need = "Priority, and time that is protected from everything else",
            contrast = { s, o -> "$s measures love in undivided time; $o may measure it in effort spent securing the future." },
            ground = { s, o -> "$s and $o are both investing in the same life, one through presence and one through protection." },
            layers = ContentVsFeelings("Schedules, hours, and missed plans.", "Grief at feeling second, against fear of failing to provide."),
            truth = "being displaced by everything else made me feel like an afterthought",
            bridge = "Time together is how I feel chosen, and I miss it.",
        ),
        Theme(
            listOf("family", "parent", "mother", "father", "in-law", "holiday", "visit"),
            need = "Rest and a say in commitments made on their behalf",
            contrast = { s, o -> "$s is guarding scarce energy; $o may be guarding time with people who won't be around forever." },
            ground = { s, o -> "$s and $o both care about family; you're protecting different parts of it." },
            layers = ContentVsFeelings("Visits, travel, and who decided.", "Depletion on one side, loyalty and grief on the other."),
            truth = "being committed without being asked made me feel like my limits don't count",
            bridge = "I want to show up for family in a way that doesn't break me, and I need us to decide together.",
        ),
    )

    private val fallbackTheme = Theme(
        emptyList(),
        need = "Respect, safety, and being taken in good faith",
        contrast = { s, o -> "$s feels unconsidered; $o may feel misjudged and unable to meet expectations they can't see." },
        ground = { s, o -> "$s and $o both want to be understood without having to defend their character first." },
        layers = ContentVsFeelings("The specific disagreement in front of you.", "The longing to feel safe and prioritized."),
        truth = "this has left me feeling unheard and worried we're drifting",
        bridge = "I want us to understand each other clearly so we can get through this without hurting each other.",
    )

    private val relayAsk = Regex("\\b(tell|let|ask|remind) (him|her|them|everyone|\\w+) (that|know|to|i)\\b|\\bpass (it|this|that) on\\b", RegexOption.IGNORE_CASE)
    private val settledWords = Regex(
        "\\b(i'?m (ok|okay|good|fine) now|we'?re (ok|okay|good)|i forgive|apology accepted|i'?m ready to talk|thank you for understanding|i understand now|resolved)\\b",
        RegexOption.IGNORE_CASE,
    )

    override suspend fun counsel(ctx: PrivateContext): Counsel {
        val lower = ctx.text.lowercase()
        // Most trigger hits wins; one stray word ("house") shouldn't decide what the fight is about.
        val matched = themes.map { th -> th to th.triggers.count { it in lower } }.filter { it.second > 0 }.maxByOrNull { it.second }?.first
        val t = matched ?: fallbackTheme
        val s = ctx.speaker.name
        val o = ctx.others.map { it.name }.joinedNaturally().ifEmpty { "the others" }
        val alerts = CleanFight.check(ctx.text)
        val settled = settledWords.containsMatchIn(ctx.text) && alerts.none { it.holds }

        val wantsRelay = relayAsk.containsMatchIn(ctx.text) || ctx.others.any { it.name.isNotBlank() && it.name.lowercase() in lower }
        val onlyAbuse = matched == null && alerts.any { it.holds }
        val relay = when {
            ctx.others.isEmpty() || !wantsRelay || onlyAbuse -> null
            settled -> "$s says they're in a better place about this, and ready to talk."
            else -> "$s wants you to know: \"${t.bridge}\""
        }
        val withheld = if (wantsRelay && onlyAbuse && ctx.others.isNotEmpty())
            "There was nothing in that I could carry to $o without it doing harm. Tell me what you need from them, and I'll take that."
        else null

        val validation = "I hear how heavy this is, $s. It makes sense that it hurts."
        val misread = "When something hurts, the mind fills the gap with the worst explanation. What looks like indifference from $o is often pressure, fear, or exhaustion wearing a mask."
        val question = if (settled) "Is there anything you still need from $o before this is behind you?"
        else "If $o understood one thing about what this has been like for you, what would you want it to be?"
        val insight = Insight(
            validation = validation,
            misinterpretation = misread,
            areaOfContrast = t.contrast(s, o),
            commonGround = t.ground(s, o),
            underlyingNeed = t.need,
            layers = t.layers,
            sandwich = IntentSandwich(
                anchorOfCare = "I care about you, and about us, which is why I'm saying this…",
                vulnerableTruth = "…${t.truth}…",
                reassurance = "…because I want us on the same side again.",
            ),
            clarifyingQuestion = question,
        )
        val coaching = alerts.joinToString(" ") { it.note }.let { if (it.isEmpty()) "" else "\n\n$it" }
        val relayLine = when {
            relay != null -> "\n\nI'll tell $o, in my words."
            withheld != null -> "\n\n$withheld"
            else -> ""
        }
        return Counsel(
            reply = "$validation\n\n$misread$coaching$relayLine\n\n$question",
            insight = insight,
            needs = matched?.let { listOf(it.need) }.orEmpty(),
            commonGround = matched?.let { listOf(it.ground(s, o).substringAfter("both ").replaceFirstChar { c -> c.uppercase() }) }.orEmpty(),
            perspective = "$s needs ${t.need.lowercase()}.",
            relay = relay,
            withheld = withheld,
            settled = settled,
            closingNote = "Everyone seems to have been heard. This mediation is over, and everything said in it is being deleted. Talk to each other directly now. Gently.",
        )
    }
}
