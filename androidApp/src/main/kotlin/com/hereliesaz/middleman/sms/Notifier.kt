package com.hereliesaz.middleman.sms

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.hereliesaz.middleman.MainActivity

/** Notifications for texts that arrive, and the quiet one that keeps the bridge alive. */
object Notifier {
    const val BRIDGE_CHANNEL = "bridge"
    private const val MESSAGES_CHANNEL = "messages"

    private fun channels(context: Context) {
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(NotificationChannel(MESSAGES_CHANNEL, "Messages", NotificationManager.IMPORTANCE_HIGH))
        manager.createNotificationChannel(NotificationChannel(BRIDGE_CHANNEL, "Mediation by text", NotificationManager.IMPORTANCE_MIN))
    }

    private fun open(context: Context) = PendingIntent.getActivity(
        context, 0, Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    fun incoming(context: Context, from: String, body: String) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        channels(context)
        val n = NotificationCompat.Builder(context, MESSAGES_CHANNEL)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle(from).setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(open(context)).setAutoCancel(true).build()
        context.getSystemService(NotificationManager::class.java).notify(from.hashCode(), n)
    }

    fun bridge(context: Context) = run {
        channels(context)
        NotificationCompat.Builder(context, BRIDGE_CHANNEL)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle("Middleman is carrying a mediation by text")
            .setContentIntent(open(context)).setOngoing(true).build()
    }
}
