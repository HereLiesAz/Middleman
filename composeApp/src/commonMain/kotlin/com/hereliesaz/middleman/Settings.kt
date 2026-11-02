package com.hereliesaz.middleman

/** Tiny persistent string store. Each platform entry point supplies one. */
interface KeyValueStore {
    operator fun get(key: String): String?
    operator fun set(key: String, value: String?)
}

/** In-memory store for previews and tests. */
class MemoryStore : KeyValueStore {
    private val map = mutableMapOf<String, String>()
    override fun get(key: String) = map[key]
    override fun set(key: String, value: String?) { if (value == null) map.remove(key) else map[key] = value }
}
