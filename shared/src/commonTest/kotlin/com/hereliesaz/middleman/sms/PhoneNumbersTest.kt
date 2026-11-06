package com.hereliesaz.middleman.sms

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertNull

class PhoneNumbersTest {
    @Test fun spellingsOfOneNumberMatch() {
        val k = PhoneNumbers.key("5045550100")
        assertEquals(k, PhoneNumbers.key("+1 (504) 555-0100"))
        assertEquals(k, PhoneNumbers.key("1-504-555-0100"))
    }

    @Test fun differentNumbersDoNot() = assertNotEquals(PhoneNumbers.key("5045550100"), PhoneNumbers.key("5045550101"))

    @Test fun shortCodesAndGarbageAreNotBridgeable() {
        assertNull(PhoneNumbers.key("22395"))
        assertNull(PhoneNumbers.key("hello"))
    }
}
