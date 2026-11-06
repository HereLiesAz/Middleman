package com.hereliesaz.middleman.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Incoming picture messages. Android won't offer an app as the messaging app without this receiver.
 * MMS isn't handled yet: it is received by the system and dropped here, so pictures sent to this phone
 * will not appear. That is the first thing to build before Middleman is anyone's only messaging app.
 */
class MmsDeliverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) = Unit
}
