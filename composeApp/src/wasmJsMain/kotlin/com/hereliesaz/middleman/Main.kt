package com.hereliesaz.middleman

import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.window.ComposeViewport
import com.hereliesaz.middleman.ui.App
import kotlinx.browser.document
import kotlinx.browser.localStorage
import kotlinx.browser.window

private object LocalStore : KeyValueStore {
    override fun get(key: String): String? = runCatching { localStorage.getItem("middleman.$key") }.getOrNull()
    override fun set(key: String, value: String?) {
        runCatching { if (value == null) localStorage.removeItem("middleman.$key") else localStorage.setItem("middleman.$key", value) }
    }
}

/** When the server hosts the web build, the page's own origin is the server. */
@OptIn(ExperimentalComposeUiApi::class)
fun main() {
    val origin = window.location.origin.takeIf { it.startsWith("http") && !it.contains(":8081") } ?: "http://localhost:8080"
    ComposeViewport(document.body!!) { App(LocalStore, origin) }
}
