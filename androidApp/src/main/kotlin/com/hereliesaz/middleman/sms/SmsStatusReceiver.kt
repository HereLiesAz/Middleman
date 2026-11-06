package com.hereliesaz.middleman.sms

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.provider.Telephony

/** Learns from the carrier whether an ordinary text went out and whether it arrived, and says so on the message. */
class SmsStatusReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val row = intent.data ?: return
        val values = ContentValues()
        when (intent.action) {
            SENT -> if (resultCode != Activity.RESULT_OK) values.put(Telephony.Sms.TYPE, Telephony.Sms.MESSAGE_TYPE_FAILED)
            DELIVERED -> values.put(Telephony.Sms.STATUS, Telephony.Sms.STATUS_COMPLETE)
        }
        if (values.size() > 0) runCatching { context.contentResolver.update(row, values, null, null) }
    }

    companion object {
        const val SENT = "com.hereliesaz.middleman.SMS_SENT"
        const val DELIVERED = "com.hereliesaz.middleman.SMS_DELIVERED"
    }
}
