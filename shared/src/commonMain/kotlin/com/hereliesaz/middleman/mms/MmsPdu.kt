package com.hereliesaz.middleman.mms

/** One piece of a picture message: some text, an image, a sound. */
class MmsPart(val contentType: String, val name: String?, val data: ByteArray)

/** The small message a carrier pushes to say "a picture message is waiting at [contentLocation]". */
data class MmsNotification(val transactionId: String?, val contentLocation: String?, val from: String?, val subject: String?, val size: Long?)

/** A downloaded picture message. [date] is in seconds. */
class MmsMessage(val from: String?, val to: List<String>, val subject: String?, val date: Long?, val parts: List<MmsPart>)

/**
 * Reads and writes the binary MMS format (OMA MMS Encapsulation 1.x over WSP), the part of picture messaging
 * that the platform leaves to the messaging app. Parsing is lenient: it keeps whatever it understood.
 */
object Mms {
    private const val SEND_REQ = 0x80
    private const val NOTIFICATION_IND = 0x82
    private const val RETRIEVE_CONF = 0x84

    fun parseNotification(pdu: ByteArray): MmsNotification? = runCatching {
        val h = Headers.read(Reader(pdu))
        if (h.type != NOTIFICATION_IND) null else MmsNotification(h.transactionId, h.contentLocation, h.from, h.subject, h.size)
    }.getOrNull()

    fun parseRetrieveConf(pdu: ByteArray): MmsMessage? = runCatching {
        val r = Reader(pdu)
        val h = Headers.read(r)
        if (h.type != RETRIEVE_CONF) return null
        MmsMessage(h.from, h.to, h.subject, h.date, if (h.hasBody) readParts(r) else emptyList())
    }.getOrNull()

    /** Builds an `m-send-req`. [to] are bare numbers; each part's bytes are carried as they are. */
    fun buildSendReq(to: List<String>, subject: String?, parts: List<MmsPart>, transactionId: String): ByteArray {
        val out = Writer()
        out.byte(0x8C); out.byte(SEND_REQ)
        out.byte(0x98); out.text(transactionId)
        out.byte(0x8D); out.byte(0x90)                  // MMS 1.0
        out.byte(0x89); out.byte(0x01); out.byte(0x81)  // From: the network fills in the sender
        to.forEach { out.byte(0x97); out.text("$it/TYPE=PLMN") }
        if (!subject.isNullOrEmpty()) { out.byte(0x96); out.encodedString(subject) }
        out.byte(0x84); out.byte(0xA3)                  // Content-Type: application/vnd.wap.multipart.mixed
        out.uintvar(parts.size)
        parts.forEachIndexed { i, part ->
            val name = part.name ?: "part$i"
            val headers = Writer().apply {
                text(part.contentType)
                byte(0x8E); text(name)                  // Content-Location
                byte(0xC0); text("<$name>")             // Content-ID
            }.bytes()
            out.uintvar(headers.size); out.uintvar(part.data.size)
            out.raw(headers); out.raw(part.data)
        }
        return out.bytes()
    }

    // ---- reading ----

    private class Headers {
        var type = -1
        var transactionId: String? = null
        var contentLocation: String? = null
        var from: String? = null
        val to = mutableListOf<String>()
        var subject: String? = null
        var date: Long? = null
        var size: Long? = null
        var hasBody = false

        companion object {
            fun read(r: Reader): Headers {
                val h = Headers()
                while (r.more()) {
                    when (val field = r.u8()) {
                        0x8C -> h.type = r.u8()
                        0x98 -> h.transactionId = r.text()
                        0x83 -> h.contentLocation = r.text()
                        0x89 -> h.from = r.address()
                        0x97 -> r.encodedString().let { h.to += it.stripType() }
                        0x81, 0x82 -> r.encodedString()
                        0x96 -> h.subject = r.encodedString()
                        0x85 -> h.date = r.longInteger()
                        0x8E -> h.size = r.longInteger()
                        0x84 -> { r.skipValue(); h.hasBody = true; return h } // Content-Type; the body follows
                        else -> if (field < 0x80) return h else r.skipValue()
                    }
                }
                return h
            }
        }
    }

    private fun readParts(r: Reader): List<MmsPart> {
        val count = r.uintvar()
        val parts = mutableListOf<MmsPart>()
        repeat(count) {
            val headerLength = r.uintvar()
            val dataLength = r.uintvar()
            val header = Reader(r.take(headerLength))
            val (type, name) = header.contentType()
            parts += MmsPart(type, name ?: header.contentLocation(), r.take(dataLength))
        }
        return parts
    }

    private fun String.stripType() = substringBefore("/TYPE=")

    private class Reader(private val b: ByteArray) {
        var pos = 0
        fun more() = pos < b.size
        fun u8(): Int = (b[pos++].toInt() and 0xFF)
        fun peek(): Int = b[pos].toInt() and 0xFF
        fun take(n: Int): ByteArray { val end = minOf(pos + n, b.size); return b.copyOfRange(pos, end).also { pos = end } }

        fun uintvar(): Int { var v = 0; while (true) { val x = u8(); v = (v shl 7) or (x and 0x7F); if (x and 0x80 == 0) return v } }

        fun text(): String {
            if (peek() == 0x7F) pos++
            val start = pos
            while (more() && b[pos].toInt() != 0) pos++
            return b.copyOfRange(start, pos).decodeToString().also { if (more()) pos++ }
        }

        fun longInteger(): Long {
            val first = u8()
            if (first >= 0x80) return (first and 0x7F).toLong()
            var v = 0L
            repeat(first) { v = (v shl 8) or u8().toLong() }
            return v
        }

        /** Length of a value that starts with a value-length, or null if it doesn't. */
        private fun valueLength(): Int? {
            val c = peek()
            return when {
                c < 31 -> { pos++; c }
                c == 31 -> { pos++; uintvar() }
                else -> null
            }
        }

        fun encodedString(): String {
            val len = valueLength() ?: return text()
            val end = pos + len
            if (peek() >= 0x80) pos++ else if (peek() in 1..30) { val n = u8(); pos += n } // charset
            return text().also { pos = maxOf(pos, end).coerceAtMost(b.size) }
        }

        fun address(): String? {
            val len = valueLength() ?: return null
            val end = pos + len
            val token = u8()
            return (if (token == 0x80) encodedString().stripType() else null).also { pos = end.coerceAtMost(b.size) }
        }

        fun skipValue() {
            val c = peek()
            when {
                c < 31 -> { pos++; pos += c }
                c == 31 -> { pos++; val n = uintvar(); pos += n }
                c >= 0x80 -> pos++
                else -> text()
            }
            pos = pos.coerceAtMost(b.size)
        }

        /** A part's Content-Type: its media type, and its name parameter if it has one. */
        fun contentType(): Pair<String, String?> {
            val c = peek()
            if (c >= 0x80) { pos++; return (WELL_KNOWN.getOrNull(c and 0x7F) ?: "application/octet-stream") to null }
            val len = valueLength() ?: return text() to null
            val end = (pos + len).coerceAtMost(b.size)
            val type = if (peek() >= 0x80) (WELL_KNOWN.getOrNull(u8() and 0x7F) ?: "application/octet-stream") else text()
            var name: String? = null
            while (pos < end) {
                when (u8()) {
                    0x85, 0x97 -> name = text()   // Name
                    0x81 -> skipValue()           // Charset
                    else -> skipValue()
                }
            }
            pos = end
            return type to name
        }

        /** The Content-Location header among a part's remaining headers, if any. */
        fun contentLocation(): String? {
            while (more()) {
                val f = u8()
                if (f == 0x8E) return text()
                if (f < 0x80) return null
                skipValue()
            }
            return null
        }
    }

    // ---- writing ----

    private class Writer {
        private val buf = ArrayList<Byte>()
        fun byte(v: Int) { buf += v.toByte() }
        fun raw(b: ByteArray) { b.forEach { buf += it } }
        fun text(s: String) { val b = s.encodeToByteArray(); if (b.isNotEmpty() && b[0].toInt() and 0x80 != 0) byte(0x7F); raw(b); byte(0) }
        fun uintvar(v: Int) {
            val groups = mutableListOf(v and 0x7F)
            var rest = v ushr 7
            while (rest > 0) { groups += (rest and 0x7F) or 0x80; rest = rest ushr 7 }
            groups.reversed().forEach(::byte)
        }
        fun encodedString(s: String) {
            val body = Writer().apply { byte(0xEA); text(s) }.bytes() // charset utf-8
            if (body.size < 31) byte(body.size) else { byte(31); uintvar(body.size) }
            raw(body)
        }
        fun bytes() = buf.toByteArray()
    }

    /** WSP well-known content types, indexed by their assigned number. Only the ones MMS actually uses are named. */
    private val WELL_KNOWN = List(0x34) { i ->
        when (i) {
            0x01 -> "text/*"; 0x02 -> "text/html"; 0x03 -> "text/plain"; 0x06 -> "text/x-vCalendar"; 0x07 -> "text/x-vCard"
            0x08 -> "text/vnd.wap.wml"; 0x0B -> "multipart/*"; 0x0C -> "multipart/mixed"; 0x1C -> "image/*"
            0x1D -> "image/gif"; 0x1E -> "image/jpeg"; 0x1F -> "image/tiff"; 0x20 -> "image/png"; 0x21 -> "image/vnd.wap.wbmp"
            0x23 -> "application/vnd.wap.multipart.mixed"; 0x33 -> "application/vnd.wap.multipart.related"
            else -> "application/octet-stream"
        }
    }
}
