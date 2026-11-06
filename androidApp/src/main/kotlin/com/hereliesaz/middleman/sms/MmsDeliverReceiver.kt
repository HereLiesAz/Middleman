package com.hereliesaz.middleman.sms

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hereliesaz.middleman.mms.Mms

/**
 * A carrier says a picture message is waiting. Middleman fetches it (the message itself comes back to
 * [MmsDownloadedReceiver]). Android won't offer an app as the messaging app without this receiver.
 */
class MmsDeliverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val notification = intent.getByteArrayExtra("data")?.let(Mms::parseNotification) ?: return
        val location = notification.contentLocation ?: return
        val (file, uri) = MmsFileProvider.create(context)
        val done = PendingIntent.getBroadcast(
            context, file.name.hashCode(),
            Intent(context, MmsDownloadedReceiver::class.java).putExtra("file", file.name).putExtra("from", notification.from),
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        runCatching { SmsSender.manager(context).downloadMultimediaMessage(context, location, uri, null, done) }
            .onFailure { file.delete() }
    }
}
