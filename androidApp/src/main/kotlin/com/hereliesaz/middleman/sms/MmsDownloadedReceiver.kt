package com.hereliesaz.middleman.sms

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hereliesaz.middleman.mms.Mms
import kotlinx.coroutines.launch
import java.io.File

/**
 * A picture message has been fetched. From someone in a mediation it is not carried, since Middleman
 * carries words, and the sender is told so. From anyone else it is filed like any picture message.
 */
class MmsDownloadedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val file = intent.getStringExtra("file")?.takeIf { '/' !in it }?.let { File(MmsFileProvider.dir(context), it) } ?: return
        val bytes = runCatching { file.readBytes() }.getOrNull()
        file.delete()
        if (resultCode != Activity.RESULT_OK || bytes == null) return
        val message = Mms.parseRetrieveConf(bytes) ?: return
        val from = message.from ?: intent.getStringExtra("from") ?: return
        val pending = goAsync()
        SmsRuntime.scope.launch {
            try {
                if (SmsRuntime.bridge(context).carries(from)) {
                    runCatching { SmsSender.send(context, from, "Middleman: I can only carry words, not pictures. Say it in words and I'll pass it on.") }
                } else if (MmsStore.insertIncoming(context, from, message) != null) {
                    val words = message.parts.firstOrNull { it.contentType == "text/plain" }?.data?.decodeToString()
                    Notifier.incoming(context, Contacts.label(context, from), words?.takeIf { it.isNotBlank() } ?: "Picture", from)
                }
            } finally {
                pending.finish()
            }
        }
    }
}
