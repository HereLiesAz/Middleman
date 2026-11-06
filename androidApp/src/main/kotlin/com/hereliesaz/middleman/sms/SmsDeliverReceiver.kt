package com.hereliesaz.middleman.sms

import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import kotlinx.coroutines.launch

/**
 * Every incoming text, because Middleman is the messaging app. A text from someone in a mediation goes
 * to Middleman and is kept nowhere; any other text is filed in the system inbox like a normal message app would.
 */
class SmsDeliverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        val at = parts.firstOrNull()?.timestampMillis ?: System.currentTimeMillis()
        val texts = parts.groupBy { it.originatingAddress.orEmpty() }.mapValues { (_, p) -> p.joinToString("") { it.messageBody.orEmpty() } }
        val pending = goAsync()
        SmsRuntime.scope.launch {
            try {
                val bridge = SmsRuntime.bridge(context)
                for ((from, body) in texts) {
                    if (bridge.carries(from)) {
                        // Carried on, not waited for: the broadcast may not outlive Middleman's thinking.
                        // If the mediation turns out to be gone, the text lands in the inbox after all.
                        SmsRuntime.scope.launch { if (!bridge.incoming(from, body)) file(context, from, body, at) }
                    } else file(context, from, body, at)
                }
            } finally {
                pending.finish()
            }
        }
    }

    private fun file(context: Context, from: String, body: String, at: Long) {
        val row = ContentValues().apply {
            put(Telephony.Sms.ADDRESS, from)
            put(Telephony.Sms.BODY, body)
            put(Telephony.Sms.DATE, at)
            put(Telephony.Sms.READ, 0)
            put(Telephony.Sms.SEEN, 0)
        }
        runCatching { context.contentResolver.insert(Telephony.Sms.Inbox.CONTENT_URI, row) }
        Notifier.incoming(context, Contacts.label(context, from), body, from)
    }
}
