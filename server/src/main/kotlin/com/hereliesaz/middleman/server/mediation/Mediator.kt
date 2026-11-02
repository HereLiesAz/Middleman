package com.hereliesaz.middleman.server.mediation

import com.hereliesaz.middleman.model.Insight
import com.hereliesaz.middleman.model.Message
import com.hereliesaz.middleman.model.Participant

/**
 * What Middleman knows when someone speaks in their room.
 *
 * Deliberately excludes other participants' raw words: a model cannot leak what it never saw.
 * Across rooms only abstractions travel: needs, a one-line perspective, and what was relayed.
 */
data class PrivateContext(
    val title: String,
    val speaker: Participant,
    val isStarter: Boolean,
    val others: List<Participant>,
    val text: String,
    /** The speaker's room, including relays they have received. */
    val history: List<Message>,
    val perspective: String?,
    val othersNeeds: Map<String, List<String>>,
    val othersPerspectives: Map<String, String>,
    val commonGround: List<String>,
)

/**
 * Middleman's answer to one turn.
 *
 * @property relay what the others will be told, in Middleman's words. `null` when there is nothing to pass on.
 * @property withheld set when the speaker wanted something passed on but nothing could be, with why.
 * @property settled Middleman's judgment that this person no longer needs a buffer.
 * @property closingNote what to tell everyone if this turn completes the resolution.
 */
data class Counsel(
    val reply: String,
    val insight: Insight,
    val needs: List<String>,
    val commonGround: List<String>,
    val perspective: String,
    val relay: String? = null,
    val withheld: String? = null,
    val settled: Boolean = false,
    val closingNote: String? = null,
)

/** The mediation brain. Implementations: [HeuristicMediator], [LlmMediator]. */
interface Mediator {
    val name: String
    suspend fun counsel(ctx: PrivateContext): Counsel
}

/** Uses [primary]; on any failure, timeout, or refusal, answers from [fallback] instead. */
class FallbackMediator(
    private val primary: Mediator,
    private val fallback: Mediator = HeuristicMediator,
    private val timeoutMs: Long = 30_000,
) : Mediator {
    override val name = "${primary.name}→${fallback.name}"
    private val log = org.slf4j.LoggerFactory.getLogger(FallbackMediator::class.java)

    override suspend fun counsel(ctx: PrivateContext): Counsel =
        try {
            kotlinx.coroutines.withTimeout(timeoutMs) { primary.counsel(ctx) }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException && e !is kotlinx.coroutines.TimeoutCancellationException) throw e
            log.warn("${primary.name} failed; using ${fallback.name}: ${e.message}")
            fallback.counsel(ctx)
        }
}
