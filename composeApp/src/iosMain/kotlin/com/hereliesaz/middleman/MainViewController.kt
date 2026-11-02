package com.hereliesaz.middleman

import androidx.compose.ui.window.ComposeUIViewController
import com.hereliesaz.middleman.ui.App
import platform.Foundation.NSUserDefaults

private object DefaultsStore : KeyValueStore {
    private val defaults = NSUserDefaults.standardUserDefaults
    override fun get(key: String): String? = defaults.stringForKey(key)
    override fun set(key: String, value: String?) { if (value == null) defaults.removeObjectForKey(key) else defaults.setObject(value, key) }
}

/** Entry point for the Xcode wrapper in `iosApp/`. */
@Suppress("unused", "FunctionName")
fun MainViewController() = ComposeUIViewController { App(DefaultsStore, "http://localhost:8080") }
