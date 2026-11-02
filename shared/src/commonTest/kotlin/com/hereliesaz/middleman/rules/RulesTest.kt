package com.hereliesaz.middleman.rules

import com.hereliesaz.middleman.model.CleanFightRule.*
import com.hereliesaz.middleman.model.Participant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CleanFightTest {
    @Test fun generalizationAnnotatesButPasses() {
        assertEquals(listOf(GENERALIZATION), CleanFight.check("You never help with the dishes."))
        assertFalse(CleanFight.shouldHold("You never help with the dishes."))
    }

    @Test fun threatsAndInsultsAreHeld() {
        assertTrue(CleanFight.shouldHold("Maybe we should just break up."))
        assertTrue(CleanFight.shouldHold("You're such an idiot."))
        assertTrue(CleanFight.shouldHold("You are so selfish."))
    }

    @Test fun wordBoundariesRespected() {
        assertTrue(CleanFight.check("I'm feeling forever grateful, nevertheless tired.").isEmpty())
    }

    @Test fun cleanStatementIsClean() {
        assertTrue(CleanFight.check("I felt lonely when dinner went cold.").isEmpty())
    }

    @Test fun triggerQuotesOffendingPhrase() {
        assertEquals("always", CleanFight.firstTrigger("You ALWAYS do this")?.lowercase())
    }
}

class ReadinessTest {
    private fun p(id: String) = Participant(id, id.uppercase(), 0)
    private fun input(id: String, msgs: Int, needs: Int) =
        ReadinessCalculator.Input(p(id), List(msgs) { "I felt unheard $it" }, List(needs) { "need $it" })

    @Test fun aloneIsNeverReady() {
        assertFalse(ReadinessCalculator.score(listOf(input("a", 9, 3)), listOf("x", "y", "z")).ready)
    }

    @Test fun twoPeopleMatchOriginalFormula() {
        // Original: depth=min(100,(2+2)*12)=48 → deesc=68; needs 1+1 → 50; ground 2 → 70; 68*.35+50*.4+70*.25 = 61.3
        val r = ReadinessCalculator.score(listOf(input("a", 2, 1), input("b", 2, 1)), listOf("g1", "g2"))
        assertEquals(68, r.deescalation); assertEquals(50, r.empathy); assertEquals(70, r.sharedGoals)
        assertEquals(61, r.score); assertFalse(r.ready)
    }

    @Test fun twoPeopleFullyHeardUnlock() {
        val r = ReadinessCalculator.score(listOf(input("a", 4, 2), input("b", 4, 2)), listOf("g1", "g2", "g3"))
        assertTrue(r.ready, r.toString())
    }

    @Test fun oneSilentPersonBlocksTheRoom() {
        val r = ReadinessCalculator.score(
            listOf(input("a", 6, 2), input("b", 6, 2), input("c", 1, 2)), listOf("g1", "g2", "g3"),
        )
        assertFalse(r.ready)
        assertTrue("C" in r.summary, r.summary)
    }

    @Test fun threePeopleCanUnlock() {
        val r = ReadinessCalculator.score(List(3) { input("p$it", 3, 2) }, listOf("g1", "g2", "g3"))
        assertTrue(r.ready, r.toString())
    }

    @Test fun recentFrictionPenalizes() {
        val calm = ReadinessCalculator.score(listOf(input("a", 2, 1), input("b", 2, 1)), emptyList())
        val heated = ReadinessCalculator.score(
            listOf(ReadinessCalculator.Input(p("a"), listOf("ok", "you never listen"), listOf("n")), input("b", 2, 1)),
            emptyList(),
        )
        assertEquals(calm.deescalation - 15, heated.deescalation)
    }

    @Test fun naturalJoin() {
        assertEquals("A, B and C", listOf("A", "B", "C").joinedNaturally())
    }
}
