package com.hereliesaz.middleman.sms

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.hereliesaz.middleman.mms.Mms
import com.hereliesaz.middleman.mms.MmsPart
import java.io.ByteArrayOutputStream

/** Sends a picture message, with or without words. */
object MmsSender {
    /** Carriers refuse large messages; most take 300 KB. */
    private const val LIMIT = 280_000

    fun send(context: Context, to: String, text: String, image: Uri?) {
        val parts = buildList {
            if (text.isNotBlank()) add(MmsPart("text/plain", "text.txt", text.encodeToByteArray()))
            image?.let { add(MmsPart("image/jpeg", "picture.jpg", shrink(context, it))) }
        }
        require(parts.isNotEmpty()) { "Nothing to send." }
        val row = MmsStore.insertOutgoing(context, to, text, parts)
        val (file, uri) = MmsFileProvider.create(context)
        file.writeBytes(Mms.buildSendReq(listOf(to), null, parts, java.util.UUID.randomUUID().toString().take(12)))
        val done = PendingIntent.getBroadcast(
            context, 0,
            Intent(context, MmsSentReceiver::class.java).setData(row).putExtra("file", file.name),
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        SmsSender.manager(context).sendMultimediaMessage(context, uri, null, null, done)
    }

    /** A JPEG small enough for a carrier. */
    private fun shrink(context: Context, source: Uri): ByteArray {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(source)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 1280) sample *= 2
        val bitmap = context.contentResolver.openInputStream(source)?.use {
            BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
        } ?: throw IllegalArgumentException("Couldn't read that picture.")
        var quality = 85
        while (true) {
            val out = ByteArrayOutputStream().also { bitmap.compress(Bitmap.CompressFormat.JPEG, quality, it) }.toByteArray()
            if (out.size <= LIMIT || quality <= 25) return out
            quality -= 15
        }
    }
}
