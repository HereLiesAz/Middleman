package com.hereliesaz.middleman.sms

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import java.io.File

/** The carrier's answer to a picture message we sent. */
class MmsSentReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        intent.getStringExtra("file")?.takeIf { '/' !in it }?.let { File(MmsFileProvider.dir(context), it).delete() }
        intent.data?.let { MmsStore.finish(context, it, resultCode == Activity.RESULT_OK) }
    }
}
