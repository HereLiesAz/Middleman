package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.model.Participant
import com.hereliesaz.middleman.server.mediation.HeuristicMediator
import com.hereliesaz.middleman.server.mediation.PrivateContext
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertTrue

class HeuristicMediatorTest {
    private fun ctx(text: String, others: Int = 1) = PrivateContext(
        title = "t", speaker = Participant("a", "Alex", 0), others = List(others) { Participant("o$it", "P$it", 0) },
        text = text, history = emptyList(), perspective = null, othersNeeds = emptyMap(), commonGround = emptyList(),
    )

    @Test fun strongestThemeWins() = runTest {
        val c = HeuristicMediator.counsel(ctx("I'm scared of losing the job and the house."))
        assertTrue("Priority" in c.insight.underlyingNeed, c.insight.underlyingNeed)
    }

    @Test fun namesEveryoneElse() = runTest {
        val c = HeuristicMediator.counsel(ctx("Nobody listens to me.", others = 3))
        assertTrue("P0, P1 and P2" in c.reply, c.reply)
    }
}
