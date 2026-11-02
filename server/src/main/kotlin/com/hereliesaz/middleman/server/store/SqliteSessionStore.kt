package com.hereliesaz.middleman.server.store

import com.hereliesaz.middleman.api.MiddlemanJson
import com.hereliesaz.middleman.server.Session
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import java.security.SecureRandom
import java.sql.Connection
import java.sql.DriverManager
import java.util.Base64
import java.util.concurrent.ConcurrentHashMap

/**
 * SQLite-backed store. Sessions are stored as JSON documents; the schema stays trivial and the
 * domain model stays in Kotlin. Tokens are stored as SHA-256 hashes, so a leaked database file
 * does not hand out access to anyone's private room.
 *
 * Swap for Postgres by implementing [SessionStore]; nothing else knows SQLite exists.
 */
class SqliteSessionStore(path: String) : SessionStore {
    private val db: Connection = DriverManager.getConnection("jdbc:sqlite:$path").apply {
        createStatement().use {
            it.execute("PRAGMA journal_mode=WAL")
            it.execute("CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, invite TEXT UNIQUE NOT NULL, doc TEXT NOT NULL)")
            it.execute("CREATE TABLE IF NOT EXISTS tokens (hash TEXT PRIMARY KEY, session_id TEXT NOT NULL, participant_id TEXT NOT NULL)")
        }
    }
    private val dbLock = Mutex()
    private val sessionLocks = ConcurrentHashMap<String, Mutex>()
    private val random = SecureRandom()

    private suspend fun <T> io(block: Connection.() -> T): T = dbLock.withLock { withContext(Dispatchers.IO) { db.block() } }

    override suspend fun create(session: Session) = io {
        prepareStatement("INSERT INTO sessions (id, invite, doc) VALUES (?, ?, ?)").use {
            it.setString(1, session.id); it.setString(2, session.inviteCode); it.setString(3, encode(session))
            it.executeUpdate()
        }
        Unit
    }

    override suspend fun get(id: String): Session? = query("SELECT doc FROM sessions WHERE id = ?", id)

    override suspend fun findByInvite(code: String): Session? =
        query("SELECT doc FROM sessions WHERE invite = ?", code.uppercase().trim())

    override suspend fun <T> update(id: String, transform: suspend (Session) -> Pair<Session, T>): T =
        sessionLocks.computeIfAbsent(id) { Mutex() }.withLock {
            val current = get(id) ?: throw NoSuchElementException("No session $id")
            val (next, result) = transform(current)
            io {
                prepareStatement("UPDATE sessions SET doc = ? WHERE id = ?").use {
                    it.setString(1, encode(next)); it.setString(2, id); it.executeUpdate()
                }
            }
            result
        }

    override suspend fun issueToken(principal: Principal): String {
        val token = ByteArray(32).also(random::nextBytes).let { Base64.getUrlEncoder().withoutPadding().encodeToString(it) }
        io {
            prepareStatement("INSERT INTO tokens (hash, session_id, participant_id) VALUES (?, ?, ?)").use {
                it.setString(1, hash(token)); it.setString(2, principal.sessionId); it.setString(3, principal.participantId)
                it.executeUpdate()
            }
        }
        return token
    }

    override suspend fun resolve(token: String): Principal? = io {
        prepareStatement("SELECT session_id, participant_id FROM tokens WHERE hash = ?").use {
            it.setString(1, hash(token))
            it.executeQuery().use { r -> if (r.next()) Principal(r.getString(1), r.getString(2)) else null }
        }
    }

    private suspend fun query(sql: String, arg: String): Session? = io {
        prepareStatement(sql).use {
            it.setString(1, arg)
            it.executeQuery().use { r -> if (r.next()) MiddlemanJson.decodeFromString(Session.serializer(), r.getString(1)) else null }
        }
    }

    private fun encode(s: Session) = MiddlemanJson.encodeToString(Session.serializer(), s)

    private fun hash(token: String): String =
        MessageDigest.getInstance("SHA-256").digest(token.toByteArray()).joinToString("") { "%02x".format(it) }
}
