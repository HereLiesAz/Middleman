package com.hereliesaz.middleman

import androidx.compose.runtime.Composable
import kotlinx.coroutines.flow.StateFlow

/**
 * Lets someone who isn't using the app take part by text. Only Android can offer it (iOS lets no app
 * handle SMS), so every other platform passes `null` and never shows any of it.
 */
interface TextBridge {
    /** True once this device can really receive and send their texts. */
    val ready: StateFlow<Boolean>

    /** Asks the user to make Middleman their messaging app, which is what receiving texts requires. */
    fun requestReady()

    /** Brings [number] into the mediation opened by [inviteCode]. [theirName] is how Middleman will name them. */
    suspend fun open(number: String, theirName: String, inviteCode: String, starterName: String)

    /** The ordinary messaging screens that replace the user's old messaging app. */
    @Composable fun Messages(onBack: () -> Unit)
}
