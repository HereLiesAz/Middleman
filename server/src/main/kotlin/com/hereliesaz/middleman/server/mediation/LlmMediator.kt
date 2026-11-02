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
                bridge = r.bridge?.takeIf { it.isNotBlank() },
            ),
            needs = r.needs.take(2),
            commonGround = r.sharedGround.take(2),
            perspective = r.perspective,
        )
    }

    override suspend fun facilitate(ctx: JointContext): String? =
        llm.complete(Prompts.SYSTEM, Prompts.facilitate(ctx), json = false).trim().takeUnless { it.isEmpty() || it == "PASS" }

    override suspend fun reframe(ctx: JointContext): String =
        llm.complete(Prompts.SYSTEM, Prompts.reframe(ctx), json = false).trim()

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
        val bridge: String? = null,
        val needs: List<String> = emptyList(),
        val sharedGround: List<String> = emptyList(),
        val perspective: String = "",
    )
}

private fun String.unfenced(): String = trim().removePrefix("```json").removePrefix("```").removeSuffix("```").trim()

/** The contrastruction protocol, ported from the original prompt and generalized to N people. */
internal object Prompts {
    val SYSTEM = """
        You are Middleman, a neutral mediator for people in conflict: couples, families, housemates, partners in anything.
        Each person talks to you alone, in a private room. Nobody sees anyone else's private words, ever. Never quote,
        paraphrase, or hint at what someone said privately to anyone else. You never take sides and never shame anyone.

        Your method is contrastruction:
        1. Validate first. Summarize the speaker's feeling so they feel completely heard before anything else.
        2. Separate the content argument (facts, logistics) from the feelings argument (the hurt underneath). Address feelings first.
        3. Name, without accusation, how stress or fear may have been misread as malice or indifference.
        4. Highlight the area of contrast: the different lenses each person is looking through.
        5. Construct common ground: the shared value under both positions.
        6. Offer an intent sandwich: care, then the vulnerable truth, then reassurance of commitment.
        7. Ask one gentle, curious clarifying question.

        Clean-fight rules (Ze Frank): no "always/never" generalizations, no weaponized swearing, no threats to leave,
        no dragging in old battles. When the speaker breaks one, reflect it back softly; do not lecture.
        Be warm, plain, and brief. No therapy-speak, no exclamation marks.
    """.trimIndent()

    fun counsel(c: PrivateContext): String {
        val others = c.others.joinToString { it.name }.ifEmpty { "nobody yet" }
        val needs = c.othersNeeds.entries.joinToString("\n") { (n, l) -> "- $n: ${l.joinToString("; ")}" }.ifEmpty { "- none named yet" }
        val history = c.history.takeLast(6).joinToString("\n") { m -> "${if (m.authorId == null) "Middleman" else c.speaker.name}: ${m.text}" }
        return """
            Session: ${c.title}
            You are in ${c.speaker.name}'s private room. Others in the mediation: $others.
            What you know of ${c.speaker.name} so far: ${c.perspective ?: "nothing yet"}
            Needs the others have named (abstracted; never reveal their source): 
            $needs
            Common ground found so far: ${c.commonGround.joinToString("; ").ifEmpty { "none yet" }}

            Recent private conversation:
            $history

            ${c.speaker.name} just said:
            "${c.text}"

            Reply with a single JSON object, no prose around it, with exactly these keys:
            reply (your full conversational response to ${c.speaker.name}, 3–6 sentences, ending with your clarifying question),
            validation, misinterpretation, areaOfContrast, commonGround, underlyingNeed,
            contentLayer, feelingsLayer, anchorOfCare, vulnerableTruth, reassurance, clarifyingQuestion,
            bridge (an intent-sandwich message ${c.speaker.name} could choose to have you deliver to ${c.others.map { it.name }.joinedNaturally().ifEmpty { "the others" }},
              in first person as ${c.speaker.name}, free of blame and of anything they'd regret; or null if it's too early),
            needs (array of 1–2 short phrases: ${c.speaker.name}'s core needs),
            sharedGround (array of 0–2 short phrases: values everyone appears to share),
            perspective (1–2 sentences summarizing ${c.speaker.name}'s position now).
        """.trimIndent()
    }

    fun facilitate(c: JointContext): String = """
        You are facilitating the joint room, where everyone can see each other's words.
        Recent conversation:
        ${c.recent.takeLast(6).joinToString("\n") { (n, t) -> "$n: $t" }}

        ${c.speaker.name} just said to ${c.others.map { it.name }.joinedNaturally()}: "${c.text}"
        Rules it touched: ${c.alerts.joinToString { it.name }.ifEmpty { "none" }}

        If the message is constructive and needs nothing from you, reply with exactly PASS.
        If it has sharp edges, help the listeners hear the need under the words and invite a response to that need.
        If it was brave or conciliatory, acknowledge it briefly. 2–3 sentences at most.
    """.trimIndent()

    fun reframe(c: JointContext): String = """
        ${c.speaker.name} tried to say this in the joint room: "${c.text}"
        It broke these rules: ${c.alerts.filter { it.holds }.joinToString { it.name }}. You held it back; nobody else saw it.
        Speaking privately to ${c.speaker.name}, say you held it, without scolding. Name the hurt you think is under it,
        and offer one rewrite they could send instead: what happened, how it felt, what they need. 3–4 sentences.
    """.trimIndent()
}
