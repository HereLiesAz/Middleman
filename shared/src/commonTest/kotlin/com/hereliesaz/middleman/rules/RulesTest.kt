package com.hereliesaz.middleman.rules

import com.hereliesaz.middleman.api.inviteCodeFrom
import com.hereliesaz.middleman.model.CleanFightRule.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CleanFightTest {
    @Test fun generalizationAnnotatesButIsntHeld() {
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

class TextTest {
    @Test fun naturalJoin() {
        assertEquals("", emptyList<String>().joinedNaturally())
        assertEquals("A and B", listOf("A", "B").joinedNaturally())
        assertEquals("A, B and C", listOf("A", "B", "C").joinedNaturally())
    }

    @Test fun inviteCodesFromLinksOrCodes() {
        assertEquals("AB23CD", inviteCodeFrom("https://middleman.hereliesaz.com/j/ab23cd"))
        assertEquals("AB23CD", inviteCodeFrom(" ab23cd "))
        assertNull(inviteCodeFrom("https://middleman.hereliesaz.com/"))
    }
}
