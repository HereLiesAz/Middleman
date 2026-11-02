package com.hereliesaz.middleman

import android.content.Context

/** [KeyValueStore] over private SharedPreferences. Excluded from cloud backup in the app manifest. */
class AndroidStore(context: Context) : KeyValueStore {
    private val prefs = context.getSharedPreferences("middleman", Context.MODE_PRIVATE)
    override fun get(key: String): String? = prefs.getString(key, null)
    override fun set(key: String, value: String?) = prefs.edit().apply { if (value == null) remove(key) else putString(key, value) }.apply()
}
