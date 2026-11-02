package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.model.Participant
import com.hereliesaz.middleman.server.mediation.HeuristicMediator
import com.hereliesaz.middleman.server.mediation.PrivateContext
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class HeuristicMediatorTest {
    private fun ctx(text: String, others: Int = 1) = PrivateContext(
        title = "t", speaker = Participant("a", "Alex", 0), isStarter = true,
        others = List(others) { Participant("o$it", "P$it", 0) },
        text = text, history = emptyList(), perspective = null,
        othersNeeds = emptyMap(), othersPerspectives = emptyMap(), commonGround = emptyList(),
    )

    @Test fun strongestThemeWins() = runTest {
        val c = HeuristicMediator.counsel(ctx("I'm scared of losing the job and the house."))
        assertTrue("Priority" in c.insight.underlyingNeed, c.insight.underlyingNeed)
    }

    @Test fun namesEveryoneElse() = runTest {
        assertTrue("P0, P1 and P2" in HeuristicMediator.counsel(ctx("Nobody listens to me.", others = 3)).reply)
    }

    @Test fun relaysOnlyWhenMeantForOthers() = runTest {
        assertNull(HeuristicMediator.counsel(ctx("I feel alone with the chores.")).relay)
        assertNotNull(HeuristicMediator.counsel(ctx("Tell them I feel alone with the chores.")).relay)
        assertNotNull(HeuristicMediator.counsel(ctx("P0 never helps with the dishes.")).relay)
    }

    @Test fun nobodyToRelayToMeansNoRelay() = runTest {
        assertNull(HeuristicMediator.counsel(ctx("Tell them I'm tired.", others = 0)).relay)
    }
}
