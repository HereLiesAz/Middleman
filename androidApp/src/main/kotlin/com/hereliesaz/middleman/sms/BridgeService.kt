package com.hereliesaz.middleman.sms

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch

/**
 * Keeps the process, and so the bridge's live connections, alive while a mediation is carried by text.
 * It stops itself when the last bridge ends. Android limits data-sync services to a few hours at a
 * stretch; if the system stops it, the next text or opening the app brings the bridge back.
 */
class BridgeService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val type = if (Build.VERSION.SDK_INT >= 29) ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC else 0
        ServiceCompat.startForeground(this, NOTIFICATION_ID, Notifier.bridge(this), type)
        SmsRuntime.scope.launch { SmsRuntime.bridge(this@BridgeService) }
        return START_STICKY
    }

    override fun onTimeout(startId: Int, fgsType: Int) = stopSelf()

    companion object {
        private const val NOTIFICATION_ID = 7

        /** Starts or stops the service to match whether any bridge is live. Never throws: a background start may be refused. */
        fun sync(app: Context, active: Boolean) {
            val intent = Intent(app, BridgeService::class.java)
            runCatching { if (active) ContextCompat.startForegroundService(app, intent) else app.stopService(intent) }
        }
    }
}
