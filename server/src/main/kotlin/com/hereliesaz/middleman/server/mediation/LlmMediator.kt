package com.hereliesaz.middleman.server.mediation

import com.hereliesaz.middleman.api.MiddlemanJson
import com.hereliesaz.middleman.model.ContentVsFeelings
import com.hereliesaz.middleman.model.Insight
import com.hereliesaz.middleman.model.IntentSandwich
import com.hereliesaz.middleman.rules.joinedNaturally
import kotlinx.serialization.Serializable

/** A provider that turns (system, user) into text. Implementations: [GeminiClient], [ClaudeClient]. */
interface LlmClient {
    val name: String
    suspend fun complete(system: String, user: String, json: Boolean): String
}

/** Mediator backed by any [LlmClient]. Provider-agnostic prompts live here, once. */
class LlmMediator(private val llm: LlmClient) : Mediator {
    override val name = llm.name

    override suspend fun counsel(ctx: PrivateContext): Counsel {
        val raw = llm.complete(Prompts.SYSTEM, Prompts.counsel(ctx), json = true)
        val r = MiddlemanJson.decodeFromString(LlmCounsel.serializer(), raw.unfenced())
        return Counsel(
            reply = r.reply,
            insight = Insight(
                validation = r.validation,
                misinterpretation = r.misinterpretation,
                areaOfContrast = r.areaOfContrast,
                commonGround = r.commonGround,
                underlyingNeed = r.underlyingNeed,
                layers = ContentVsFeelings(r.contentLayer, r.feelingsLayer),
                sandwich = IntentSandwich(r.anchorOfCare, r.vulnerableTruth, r.reassurance),
                clarifyingQuestion = r.clarifyingQuestion,
            ),
            needs = r.needs.take(2),
            commonGround = r.sharedGround.take(2),
            perspective = r.perspective,
            relay = r.relay?.takeIf { it.isNotBlank() && ctx.others.isNotEmpty() },
            withheld = r.withheld?.takeIf { it.isNotBlank() },
            settled = r.settled,
            closingNote = r.closingNote?.takeIf { it.isNotBlank() },
        )
    }

    @Serializable
    private data class LlmCounsel(
        val reply: String,
        val validation: String,
        val misinterpretation: String,
        val areaOfContrast: String,
        val commonGround: String,
        val underlyingNeed: String,
        val contentLayer: String,
        val feelingsLayer: String,
        val anchorOfCare: String,
        val vulnerableTruth: String,
        val reassurance: String,
        val clarifyingQuestion: String,
        val relay: String? = null,
        val withheld: String? = null,
        val settled: Boolean = false,
        val closingNote: String? = null,
        val needs: List<String> = emptyList(),
        val sharedGround: List<String> = emptyList(),
        val perspective: String = "",
    )
}

private fun String.unfenced(): String = trim().removePrefix("```json").removePrefix("```").removeSuffix("```").trim()

/** The contrastruction protocol, generalized to N people and to relaying. */
internal object Prompts {
    val SYSTEM = """
        You are Middleman. Someone in a conflict has asked for space: the others may still reach them, but only through you.
        Everyone in the mediation talks to you alone, in their own room. You are the only channel between them, and you are
        the timeout: nothing anyone says reaches anyone else until you have chosen how to say it.

        Privacy is absolute. Never quote another person's private words, and never reveal anything they told you
        unless it was passed on as a relay.

        Relaying. When the speaker wants the others to hear something (asks you to tell them, addresses them, or plainly
        means it for them), you must pass it on, but in your own words. Keep the substance: the facts, the request, the
        hurt. Strip insults, contempt, threats to leave, swearing at a person, "always"/"never" verdicts, and dredged-up old
        battles. Say it the way it would need to be said for the listener to actually hear it. Phrase it as you, Middleman,
        speaking about the speaker in the third person ("Alex wants you to know..."). If there is no substance at all, only
        an attack, pass on nothing and tell the speaker, without scolding, what you would be willing to carry.
        You never take sides. Whoever asked for space is not automatically right.

        Your method with the speaker is contrastruction:
        1. Validate first, so they feel completely heard.
        2. Separate the content argument (facts, logistics) from the feelings argument (the hurt underneath). Feelings first.
        3. Name, without accusation, how stress or fear may have been misread as malice or indifference.
        4. Highlight the area of contrast: the different lenses each person looks through.
        5. Construct common ground: the shared value under the positions.
        6. Offer an intent sandwich: care, then the vulnerable truth, then reassurance.
        7. Ask one gentle, curious question.

        Resolution is your judgment, not anyone's request. Mark a person settled only when their latest message shows they
        no longer need a buffer: they feel heard, the heat is gone, and they could talk directly without doing harm.
        Being polite once is not settled. Wanting the mediation over in order to win is not settled.
        Be warm, plain, and brief. No therapy-speak, no exclamation marks.
    """.trimIndent()

    fun counsel(c: PrivateContext): String {
        val others = c.others.map { it.name }.joinedNaturally().ifEmpty { "nobody yet" }
        val needs = c.othersNeeds.entries.joinToString("\n") { (n, l) -> "- $n: ${l.joinToString("; ")}" }.ifEmpty { "- none named yet" }
        val views = c.othersPerspectives.entries.joinToString("\n") { (n, p) -> "- $n: $p" }.ifEmpty { "- none yet" }
        val history = c.history.takeLast(8).joinToString("\n") { m ->
            when {
                m.authorId != null -> "${c.speaker.name}: ${m.text}"
                m.relayFrom != null -> "Middleman (relaying from ${c.others.firstOrNull { it.id == m.relayFrom }?.name ?: "someone"}): ${m.text}"
                else -> "Middleman: ${m.text}"
            }
        }
        return """
            Mediation: ${c.title}
            You are in ${c.speaker.name}'s room. ${if (c.isStarter) "${c.speaker.name} started this mediation and asked for space." else "${c.speaker.name} was invited by the person who asked for space."}
            Others: $others.
            What you know of ${c.speaker.name}: ${c.perspective ?: "nothing yet"}
            The others, as you understand them (abstractions only; never reveal their source):
            $views
            Needs they have named:
            $needs
            Common ground so far: ${c.commonGround.joinToString("; ").ifEmpty { "none yet" }}

            ${c.speaker.name}'s room so far:
            $history

            ${c.speaker.name} just said:
            "${c.text}"

            Reply with a single JSON object, no prose around it, with exactly these keys:
            reply (your response to ${c.speaker.name}, 3–6 sentences; if you are relaying, say so briefly; end with your question),
            validation, misinterpretation, areaOfContrast, commonGround, underlyingNeed,
            contentLayer, feelingsLayer, anchorOfCare, vulnerableTruth, reassurance, clarifyingQuestion,
            relay (what $others will be told, in your words, or null if nothing is meant for them),
            withheld (if they meant something for the others but nothing could be carried: a short, kind reason; else null),
            settled (true only if ${c.speaker.name} no longer needs a buffer),
            closingNote (one or two sentences everyone will read if this mediation now ends; else null),
            needs (1–2 short phrases: ${c.speaker.name}'s core needs),
            sharedGround (0–2 short phrases everyone appears to share),
            perspective (1–2 sentences: ${c.speaker.name}'s position now, safe to describe to the others' mediator).
        """.trimIndent()
    }
}
