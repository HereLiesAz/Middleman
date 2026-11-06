package com.hereliesaz.middleman.sms

import android.content.Context
import com.hereliesaz.middleman.api.MiddlemanJson
import kotlinx.serialization.builtins.ListSerializer

/** [BridgeBook] in private preferences (excluded from backup). Holds tokens and numbers, never what anyone said. */
class PrefsBridgeBook(context: Context) : BridgeBook {
    private val prefs = context.getSharedPreferences("middleman_sms", Context.MODE_PRIVATE)
    private val serializer = ListSerializer(Bridge.serializer())

    override fun load(): List<Bridge> =
        prefs.getString(KEY, null)?.let { runCatching { MiddlemanJson.decodeFromString(serializer, it) }.getOrNull() }.orEmpty()

    override fun save(bridges: List<Bridge>) {
        prefs.edit().apply { if (bridges.isEmpty()) remove(KEY) else putString(KEY, MiddlemanJson.encodeToString(serializer, bridges)) }.apply()
    }

    private companion object { const val KEY = "bridges" }
}
