package com.hereliesaz.middleman.sms

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.telephony.SmsManager

/** Sends texts from this phone's own number. Long messages are split into parts and rejoined by the carrier. */
class SmsSender(private val context: Context) : SmsOut {
    override suspend fun send(number: String, text: String) = Companion.send(context, number, text)

    companion object {
        fun manager(context: Context): SmsManager = if (Build.VERSION.SDK_INT >= 31) context.getSystemService(SmsManager::class.java)
        else @Suppress("DEPRECATION") SmsManager.getDefault()

        /** Sends [text]. With [row], the carrier's sent and delivered reports are written onto that message. */
        fun send(context: Context, number: String, text: String, row: Uri? = null) {
            val manager = manager(context)
            val parts = manager.divideMessage(text)
            fun reports(action: String) = row?.let {
                val intent = Intent(action, it, context, SmsStatusReceiver::class.java)
                ArrayList(List(parts.size) { i -> PendingIntent.getBroadcast(context, i, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT) })
            }
            manager.sendMultipartTextMessage(number, null, parts, reports(SmsStatusReceiver.SENT), reports(SmsStatusReceiver.DELIVERED))
        }
    }
}
