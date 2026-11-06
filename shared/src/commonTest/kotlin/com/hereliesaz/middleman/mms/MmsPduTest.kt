package com.hereliesaz.middleman.mms

import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class MmsPduTest {
    private fun bytes(vararg v: Int) = ByteArray(v.size) { v[it].toByte() }
    private fun ascii(s: String) = s.encodeToByteArray() + 0
    /** From: value-length, address-present token, the address. */
    private fun from(address: String) = bytes(0x89, 1 + ascii(address).size, 0x80) + ascii(address)

    /** A carrier's notification, assembled by hand from the spec rather than by our own writer. */
    @Test fun readsANotification() {
        val pdu = bytes(0x8C, 0x82) + bytes(0x98) + ascii("T123") + bytes(0x8D, 0x90) +
            from("+15045550100/TYPE=PLMN") +
            bytes(0x8E, 0x02, 0x08, 0x00) + bytes(0x83) + ascii("http://mmsc.example/m1")
        val n = assertNotNull(Mms.parseNotification(pdu))
        assertEquals("T123", n.transactionId)
        assertEquals("http://mmsc.example/m1", n.contentLocation)
        assertEquals("+15045550100", n.from)
        assertEquals(2048L, n.size)
    }

    /** A retrieve-conf with a text part and a jpeg, each with the headers a real MMSC sends. */
    @Test fun readsADownloadedMessage() {
        val jpeg = bytes(0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10)
        val text = "look at this".encodeToByteArray()
        val partOneHeaders = bytes(0x83) + bytes(0x8E) + ascii("t.txt") // content-type text/plain (0x03|0x80), location
        val partTwoHeaders = bytes(0x1E or 0x80) + bytes(0x8E) + ascii("p.jpg")
        val body = bytes(2) +
            bytes(partOneHeaders.size, text.size) + partOneHeaders + text +
            bytes(partTwoHeaders.size, jpeg.size) + partTwoHeaders + jpeg
        val pdu = bytes(0x8C, 0x84) + bytes(0x98) + ascii("T9") + bytes(0x8D, 0x90) +
            bytes(0x85, 0x04, 0x65, 0x00, 0x00, 0x00) +
            from("+15045550100/TYPE=PLMN") +
            bytes(0x84, 0xA3) + body
        val m = assertNotNull(Mms.parseRetrieveConf(pdu))
        assertEquals("+15045550100", m.from)
        assertEquals(0x65000000L, m.date)
        assertEquals(listOf("text/plain", "image/jpeg"), m.parts.map { it.contentType })
        assertEquals("look at this", m.parts[0].data.decodeToString())
        assertContentEquals(jpeg, m.parts[1].data)
        assertEquals("p.jpg", m.parts[1].name)
    }

    @Test fun whatItWritesItReadsBackIncludingNames() {
        val img = ByteArray(300) { (it * 7).toByte() }
        val pdu = Mms.buildSendReq(
            listOf("+15045550100"), "hello",
            listOf(MmsPart("text/plain", "t.txt", "see attached".encodeToByteArray()), MmsPart("image/jpeg", "a.jpg", img)),
            "TX1",
        )
        // A send-req isn't a retrieve-conf, so it must be refused by the reader that expects one.
        assertNull(Mms.parseRetrieveConf(pdu))
        // But the same bytes with the message type swapped are exactly what a retrieve-conf looks like.
        pdu[1] = 0x84.toByte()
        val m = assertNotNull(Mms.parseRetrieveConf(pdu))
        assertEquals(listOf("+15045550100"), m.to)
        assertEquals("hello", m.subject)
        assertEquals(listOf("t.txt", "a.jpg"), m.parts.map { it.name })
        assertContentEquals(img, m.parts[1].data)
    }

    @Test fun garbageIsRefusedNotThrown() {
        assertNull(Mms.parseNotification(bytes(1, 2, 3)))
        assertNull(Mms.parseRetrieveConf(ByteArray(0)))
    }
}
