package com.hereliesaz.middleman.sms

/**
 * Two spellings of one number ("+1 (504) 555-0100", "5045550100") must match. The key is the last ten
 * digits, or all of them when there are fewer. Numbers with fewer than seven digits are not numbers
 * Middleman will bridge (short codes, garbage), so they have no key.
 */
object PhoneNumbers {
    fun key(raw: String): String? {
        val digits = raw.filter(Char::isDigit)
        return if (digits.length < 7) null else digits.takeLast(10)
    }
}
