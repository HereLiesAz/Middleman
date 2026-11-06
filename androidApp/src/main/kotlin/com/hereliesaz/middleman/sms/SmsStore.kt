package com.hereliesaz.middleman.sms

import android.content.ContentValues
import android.content.Context
import android.provider.Telephony

data class Conversation(val id: Long, val address: String, val last: String, val date: Long)
data class Text(val id: Long, val body: String, val date: Long, val mine: Boolean)

/** Reads and writes the system message store. Only the default messaging app may, which is why Middleman asks to be one. */
object SmsStore {
    /** One row per conversation, newest first. */
    fun conversations(context: Context): List<Conversation> {
        val seen = mutableSetOf<Long>()
        val out = mutableListOf<Conversation>()
        context.contentResolver.query(
            Telephony.Sms.CONTENT_URI,
            arrayOf(Telephony.Sms.THREAD_ID, Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE),
            null, null, "${Telephony.Sms.DATE} DESC",
        )?.use { c ->
            while (c.moveToNext() && out.size < 500) {
                val id = c.getLong(0)
                if (seen.add(id)) out += Conversation(id, c.getString(1).orEmpty(), c.getString(2).orEmpty(), c.getLong(3))
            }
        }
        return out
    }

    /** One conversation, oldest first. */
    fun thread(context: Context, id: Long): List<Text> {
        val out = mutableListOf<Text>()
        context.contentResolver.query(
            Telephony.Sms.CONTENT_URI,
            arrayOf(Telephony.Sms._ID, Telephony.Sms.BODY, Telephony.Sms.DATE, Telephony.Sms.TYPE),
            "${Telephony.Sms.THREAD_ID} = ?", arrayOf(id.toString()), "${Telephony.Sms.DATE} ASC",
        )?.use { c ->
            while (c.moveToNext()) out += Text(c.getLong(0), c.getString(1).orEmpty(), c.getLong(2), c.getInt(3) != Telephony.Sms.MESSAGE_TYPE_INBOX)
        }
        return out
    }

    /** Sends an ordinary text and files it as sent. (Mediation traffic never comes through here.) */
    fun send(context: Context, address: String, body: String) {
        SmsSender.send(context, address, body)
        val row = ContentValues().apply {
            put(Telephony.Sms.ADDRESS, address)
            put(Telephony.Sms.BODY, body)
            put(Telephony.Sms.DATE, System.currentTimeMillis())
            put(Telephony.Sms.READ, 1)
        }
        runCatching { context.contentResolver.insert(Telephony.Sms.Sent.CONTENT_URI, row) }
    }
}
