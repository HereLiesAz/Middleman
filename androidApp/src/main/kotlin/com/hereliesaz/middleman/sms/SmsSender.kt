package com.hereliesaz.middleman.sms

import android.content.Context
import android.os.Build
import android.telephony.SmsManager

/** Sends texts from this phone's own number. Long messages are split into parts and rejoined by the carrier. */
class SmsSender(private val context: Context) : SmsOut {
    override suspend fun send(number: String, text: String) = Companion.send(context, number, text)

    companion object {
        fun send(context: Context, number: String, text: String) {
            val manager = if (Build.VERSION.SDK_INT >= 31) context.getSystemService(SmsManager::class.java)
            else @Suppress("DEPRECATION") SmsManager.getDefault()
            manager.sendMultipartTextMessage(number, null, manager.divideMessage(text), null, null)
        }
    }
}
