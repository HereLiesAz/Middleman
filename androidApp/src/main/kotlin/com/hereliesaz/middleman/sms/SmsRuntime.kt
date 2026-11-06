package com.hereliesaz.middleman.sms

import android.content.Context
import com.hereliesaz.middleman.AndroidStore
import com.hereliesaz.middleman.BuildConfig
import com.hereliesaz.middleman.api.MiddlemanClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.security.MessageDigest

/**
 * The one [SmsBridge] of this process, and the scope it lives in. Receivers, the service and the UI
 * all reach the same bridge through here; a cold process rebuilds it from the saved [Bridge]s.
 */
object SmsRuntime {
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var bridge: SmsBridge? = null
    private var resumed = false
    private val resume = Mutex()

    private fun build(app: Context): SmsBridge {
        val server = AndroidStore(app)["server"] ?: BuildConfig.DEFAULT_SERVER
        return SmsBridge(scope, MiddlemanClient(server), SmsSender(app), PrefsBridgeBook(app)) { active -> BridgeService.sync(app, active) }
    }

    /** The bridge, with any bridges saved before a restart already running. */
    suspend fun bridge(context: Context): SmsBridge {
        val app = context.applicationContext
        val b = synchronized(this) { bridge ?: build(app).also { bridge = it } }
        resume.withLock { if (!resumed) { resumed = true; b.resume() } }
        return b
    }

    /**
     * A device id for the texter, stable for this starter and number. A hash: the server learns that
     * "the same two people" are starting again, and nothing about who they are.
     */
    fun deviceIdFor(app: Context, number: String): String {
        val starter = AndroidStore(app)["device"].orEmpty()
        val digest = MessageDigest.getInstance("SHA-256").digest("$starter|${PhoneNumbers.key(number)}".toByteArray())
        return "sms-" + digest.joinToString("") { "%02x".format(it) }
    }
}
