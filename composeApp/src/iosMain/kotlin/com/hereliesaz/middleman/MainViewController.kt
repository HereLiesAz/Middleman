package com.hereliesaz.middleman

import androidx.compose.ui.window.ComposeUIViewController
import com.hereliesaz.middleman.api.inviteCodeFrom
import com.hereliesaz.middleman.ui.App
import platform.Foundation.NSUserDefaults
import kotlin.experimental.ExperimentalNativeApi

private object DefaultsStore : KeyValueStore {
    private val defaults = NSUserDefaults.standardUserDefaults
    override fun get(key: String): String? = defaults.stringForKey(key)
    override fun set(key: String, value: String?) { if (value == null) defaults.removeObjectForKey(key) else defaults.setObject(value, key) }
}

/** Debug builds talk to a server on this machine; release builds to the hosted one. */
@OptIn(ExperimentalNativeApi::class)
private val defaultServer = if (Platform.isDebugBinary) "http://localhost:8080" else "https://middleman.hereliesaz.com"

/** Entry point for the Xcode wrapper in `iosApp/`. */
@Suppress("unused", "FunctionName")
fun MainViewController(inviteUrl: String? = null) =
    ComposeUIViewController { App(DefaultsStore, defaultServer, inviteUrl?.let(::inviteCodeFrom)) }
