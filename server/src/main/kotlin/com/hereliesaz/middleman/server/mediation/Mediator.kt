package com.hereliesaz.middleman.server.mediation

import com.hereliesaz.middleman.model.CleanFightRule
import com.hereliesaz.middleman.model.Insight
import com.hereliesaz.middleman.model.Message
import com.hereliesaz.middleman.model.Participant

/**
 * What Middleman knows when someone speaks in their private room.
 *
 * Deliberately excludes other participants' raw words: a model cannot leak what it never saw.
 * Only their already-abstracted needs travel across rooms.
 */
data class PrivateContext(
    val title: String,
    val speaker: Participant,
    val others: List<Participant>,
    val text: String,
    val history: List<Message>,
    val perspective: String?,
    val othersNeeds: Map<String, List<String>>,
    val commonGround: List<String>,
)

data class Counsel(
    val reply: String,
    val insight: Insight,
    val needs: List<String>,
    val commonGround: List<String>,
    val perspective: String,
)

/** What Middleman knows when someone speaks in the joint room. */
data class JointContext(
    val speaker: Participant,
    val others: List<Participant>,
    val text: String,
    val alerts: List<CleanFightRule>,
    /** Recent public lines as (speaker name, text). */
    val recent: List<Pair<String, String>>,
)

/** The mediation brain. Implementations: [HeuristicMediator], [LlmMediator]. */
interface Mediator {
    val name: String

    /** Respond privately with validation and contrastruction. */
    suspend fun counsel(ctx: PrivateContext): Counsel

    /** Optionally speak into the joint room after a message passed. `null` means stay quiet. */
    suspend fun facilitate(ctx: JointContext): String?

    /** Coach the speaker, privately, after their joint-room message was held. */
    suspend fun reframe(ctx: JointContext): String
}

/** Uses [primary]; on any failure, timeout, or refusal, answers from [fallback] instead. */
class FallbackMediator(
    private val primary: Mediator,
    private val fallback: Mediator = HeuristicMediator,
    private val timeoutMs: Long = 30_000,
) : Mediator {
    override val name = "${primary.name}→${fallback.name}"
    private val log = org.slf4j.LoggerFactory.getLogger(FallbackMediator::class.java)

    private suspend fun <T> attempt(what: String, a: suspend Mediator.() -> T): T =
        try {
            kotlinx.coroutines.withTimeout(timeoutMs) { primary.a() }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException && e !is kotlinx.coroutines.TimeoutCancellationException) throw e
            log.warn("${primary.name} failed to $what; using ${fallback.name}: ${e.message}")
            fallback.a()
        }

    override suspend fun counsel(ctx: PrivateContext) = attempt("counsel") { counsel(ctx) }
    override suspend fun facilitate(ctx: JointContext) = attempt("facilitate") { facilitate(ctx) }
    override suspend fun reframe(ctx: JointContext) = attempt("reframe") { reframe(ctx) }
}
