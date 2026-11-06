package com.hereliesaz.middleman.sms

import android.app.Service
import android.content.Intent
import android.os.IBinder

/** "Reply by message" from the call screen: the system hands the default messaging app a number and a text to send. */
class RespondViaMessageService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val number = intent?.data?.schemeSpecificPart?.substringBefore('?')
        val text = intent?.getStringExtra(Intent.EXTRA_TEXT)
        if (!number.isNullOrBlank() && !text.isNullOrBlank()) runCatching { SmsSender.send(this, number, text) }
        stopSelf(startId)
        return START_NOT_STICKY
    }
}
