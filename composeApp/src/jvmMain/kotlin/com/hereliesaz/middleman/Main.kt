package com.hereliesaz.middleman

import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import com.hereliesaz.middleman.ui.App
import java.util.prefs.Preferences

private object PrefsStore : KeyValueStore {
    private val prefs = Preferences.userRoot().node("com/hereliesaz/middleman")
    override fun get(key: String): String? = prefs.get(key, null)
    override fun set(key: String, value: String?) { if (value == null) prefs.remove(key) else prefs.put(key, value) }
}

fun main() = application {
    Window(onCloseRequest = ::exitApplication, title = "Middleman", state = rememberWindowState(width = 960.dp, height = 820.dp)) {
        App(PrefsStore, System.getenv("MIDDLEMAN_SERVER") ?: "http://localhost:8080")
    }
}
