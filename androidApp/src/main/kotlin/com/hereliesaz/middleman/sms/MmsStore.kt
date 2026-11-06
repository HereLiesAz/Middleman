package com.hereliesaz.middleman.sms

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.provider.Telephony
import com.hereliesaz.middleman.mms.MmsMessage
import com.hereliesaz.middleman.mms.MmsPart

/** Picture messages in the system message store, which the default messaging app owns. */
object MmsStore {
    private const val BOX_INBOX = 1
    private const val BOX_SENT = 2
    private const val BOX_OUTBOX = 4
    private const val BOX_FAILED = 5
    private const val ADDRESS_FROM = 137
    private const val ADDRESS_TO = 151
    private const val UTF8 = 106
    private val PARTS: Uri = Uri.parse("content://mms/part")

    /** Files a downloaded message into [threadAddress]'s conversation and returns its id. */
    fun insertIncoming(context: Context, from: String, message: MmsMessage): Long? {
        val cr = context.contentResolver
        val values = ContentValues().apply {
            put(Telephony.Mms.THREAD_ID, Telephony.Threads.getOrCreateThreadId(context, setOf(from)))
            put(Telephony.Mms.DATE, message.date ?: (System.currentTimeMillis() / 1000))
            put(Telephony.Mms.MESSAGE_BOX, BOX_INBOX)
            put(Telephony.Mms.READ, 0)
            put(Telephony.Mms.SEEN, 0)
            put(Telephony.Mms.SUBJECT, message.subject)
            put(Telephony.Mms.MESSAGE_TYPE, 132)
            put(Telephony.Mms.MMS_VERSION, 18)
            put(Telephony.Mms.CONTENT_TYPE, "application/vnd.wap.multipart.related")
        }
        val id = cr.insert(Telephony.Mms.Inbox.CONTENT_URI, values)?.let(ContentUris::parseId) ?: return null
        address(context, id, from, ADDRESS_FROM)
        message.to.forEach { address(context, id, it, ADDRESS_TO) }
        parts(context, id, message.parts)
        return id
    }

    /** Files an outgoing message as waiting to send and returns its URI. */
    fun insertOutgoing(context: Context, to: String, text: String, parts: List<MmsPart>): Uri? {
        val values = ContentValues().apply {
            put(Telephony.Mms.THREAD_ID, Telephony.Threads.getOrCreateThreadId(context, setOf(to)))
            put(Telephony.Mms.DATE, System.currentTimeMillis() / 1000)
            put(Telephony.Mms.MESSAGE_BOX, BOX_OUTBOX)
            put(Telephony.Mms.READ, 1)
            put(Telephony.Mms.SEEN, 1)
            put(Telephony.Mms.MESSAGE_TYPE, 128)
            put(Telephony.Mms.MMS_VERSION, 18)
            put(Telephony.Mms.CONTENT_TYPE, "application/vnd.wap.multipart.related")
        }
        val uri = context.contentResolver.insert(Telephony.Mms.Outbox.CONTENT_URI, values) ?: return null
        val id = ContentUris.parseId(uri)
        address(context, id, "insert-address-token", ADDRESS_FROM)
        address(context, id, to, ADDRESS_TO)
        parts(context, id, parts)
        return uri
    }

    /** Records how a send ended. */
    fun finish(context: Context, row: Uri, ok: Boolean) {
        runCatching { context.contentResolver.update(row, ContentValues().apply { put(Telephony.Mms.MESSAGE_BOX, if (ok) BOX_SENT else BOX_FAILED) }, null, null) }
    }

    private fun address(context: Context, id: Long, address: String, type: Int) {
        val row = ContentValues().apply { put("address", address); put("type", type); put("charset", UTF8) }
        runCatching { context.contentResolver.insert(Uri.parse("content://mms/$id/addr"), row) }
    }

    private fun parts(context: Context, id: Long, parts: List<MmsPart>) {
        val cr = context.contentResolver
        parts.forEachIndexed { i, p ->
            val name = p.name ?: "part$i"
            val row = ContentValues().apply {
                put("mid", id); put("ct", p.contentType); put("name", name); put("cid", "<$name>"); put("cl", name)
                if (p.contentType.startsWith("text/")) { put("chset", UTF8); put("text", p.data.decodeToString()) }
            }
            val uri = runCatching { cr.insert(Uri.parse("content://mms/$id/part"), row) }.getOrNull() ?: return@forEachIndexed
            if (!p.contentType.startsWith("text/")) runCatching { cr.openOutputStream(uri)?.use { it.write(p.data) } }
        }
    }

    /** The conversation's picture messages, as display rows. Their dates are in seconds. */
    fun thread(context: Context, threadId: Long): List<Text> {
        val out = mutableListOf<Text>()
        context.contentResolver.query(
            Telephony.Mms.CONTENT_URI, arrayOf(Telephony.Mms._ID, Telephony.Mms.DATE, Telephony.Mms.MESSAGE_BOX),
            "${Telephony.Mms.THREAD_ID} = ?", arrayOf(threadId.toString()), null,
        )?.use { c ->
            while (c.moveToNext()) {
                val id = c.getLong(0)
                val (text, image) = content(context, id)
                val box = c.getInt(2)
                out += Text(
                    id = -id, // sms and mms ids overlap; negative marks these
                    body = text, date = c.getLong(1) * 1000, mine = box != BOX_INBOX,
                    failed = box == BOX_FAILED, image = image,
                )
            }
        }
        return out
    }

    /** The latest picture message per conversation, as list rows. */
    fun latest(context: Context): List<Conversation> {
        val out = mutableListOf<Conversation>()
        val seen = mutableSetOf<Long>()
        context.contentResolver.query(
            Telephony.Mms.CONTENT_URI, arrayOf(Telephony.Mms._ID, Telephony.Mms.THREAD_ID, Telephony.Mms.DATE),
            null, null, "${Telephony.Mms.DATE} DESC",
        )?.use { c ->
            while (c.moveToNext() && out.size < 500) {
                val thread = c.getLong(1)
                if (!seen.add(thread)) continue
                val id = c.getLong(0)
                val (text, image) = content(context, id)
                out += Conversation(thread, otherParty(context, id), text.ifBlank { if (image != null) "Picture" else "" }, c.getLong(2) * 1000)
            }
        }
        return out
    }

    /** A message's text, and the id of its first image part. */
    private fun content(context: Context, id: Long): Pair<String, Long?> {
        val text = StringBuilder()
        var image: Long? = null
        context.contentResolver.query(PARTS, arrayOf("_id", "ct", "text"), "mid = ?", arrayOf(id.toString()), null)?.use { c ->
            while (c.moveToNext()) {
                val type = c.getString(1).orEmpty()
                if (type == "text/plain") c.getString(2)?.let { text.append(it) }
                else if (type.startsWith("image/") && image == null) image = c.getLong(0)
            }
        }
        return text.toString() to image
    }

    private fun otherParty(context: Context, id: Long): String {
        context.contentResolver.query(Uri.parse("content://mms/$id/addr"), arrayOf("address", "type"), null, null, null)?.use { c ->
            while (c.moveToNext()) {
                val a = c.getString(0).orEmpty()
                if (a.isNotBlank() && a != "insert-address-token") return a
            }
        }
        return ""
    }

    /** Decodes an image part, shrunk to roughly [maxSide] pixels. */
    fun image(context: Context, partId: Long, maxSide: Int = 720): android.graphics.Bitmap? = runCatching {
        val uri = Uri.parse("content://mms/part/$partId")
        val bounds = android.graphics.BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(uri)?.use { android.graphics.BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxSide) sample *= 2
        context.contentResolver.openInputStream(uri)?.use {
            android.graphics.BitmapFactory.decodeStream(it, null, android.graphics.BitmapFactory.Options().apply { inSampleSize = sample })
        }
    }.getOrNull()
}
