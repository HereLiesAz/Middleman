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
 * SQLite-backed store. Sessions are JSON documents; `members` indexes which devices are in which
 * session; tokens are stored as SHA-256 hashes. Deleting a session deletes all three, and
 * `secure_delete` zeroes the freed pages so a deleted fight doesn't linger in the file.
 *
 * Swap for Postgres by implementing [SessionStore]; nothing else knows SQLite exists.
 */
class SqliteSessionStore(path: String) : SessionStore {
    private val db: Connection = DriverManager.getConnection("jdbc:sqlite:$path").apply {
        createStatement().use {
            it.execute("PRAGMA journal_mode=WAL")
            it.execute("PRAGMA secure_delete=ON")
            it.execute("PRAGMA foreign_keys=ON")
            it.execute("CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, invite TEXT UNIQUE NOT NULL, expires_at INTEGER, doc TEXT NOT NULL)")
            it.execute("CREATE TABLE IF NOT EXISTS members (session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, device_id TEXT NOT NULL, PRIMARY KEY (session_id, device_id))")
            it.execute("CREATE TABLE IF NOT EXISTS tokens (hash TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, participant_id TEXT NOT NULL)")
            it.execute("CREATE INDEX IF NOT EXISTS members_device ON members(device_id)")
        }
    }
    private val dbLock = Mutex()
    private val sessionLocks = ConcurrentHashMap<String, Mutex>()
    private val random = SecureRandom()

    private suspend fun <T> io(block: Connection.() -> T): T = dbLock.withLock { withContext(Dispatchers.IO) { db.block() } }

    override suspend fun create(session: Session) = io {
        prepareStatement("INSERT INTO sessions (id, invite, expires_at, doc) VALUES (?, ?, ?, ?)").use {
            it.setString(1, session.id); it.setString(2, session.inviteCode)
            session.expiresAt?.let { e -> it.setLong(3, e) } ?: it.setNull(3, java.sql.Types.INTEGER)
            it.setString(4, encode(session)); it.executeUpdate()
        }
        indexMembers(session)
    }

    override suspend fun get(id: String): Session? = query("SELECT doc FROM sessions WHERE id = ?", id)

    override suspend fun findByInvite(code: String): Session? =
        query("SELECT doc FROM sessions WHERE invite = ?", code.uppercase().trim())

    override suspend fun <T> update(id: String, transform: suspend (Session) -> Pair<Session, T>): T =
        sessionLocks.computeIfAbsent(id) { Mutex() }.withLock {
            val current = get(id) ?: throw NoSuchElementException("This mediation has ended.")
            val (next, result) = transform(current)
            io {
                prepareStatement("UPDATE sessions SET doc = ? WHERE id = ?").use {
                    it.setString(1, encode(next)); it.setString(2, id); it.executeUpdate()
                }
                indexMembers(next)
            }
            result
        }

    override suspend fun delete(id: String) {
        io { prepareStatement("DELETE FROM sessions WHERE id = ?").use { it.setString(1, id); it.executeUpdate() } }
        sessionLocks.remove(id)
    }

    override suspend fun sessionsWithAll(deviceIds: Set<String>): List<String> = io {
        if (deviceIds.isEmpty()) return@io emptyList()
        val marks = deviceIds.joinToString(",") { "?" }
        prepareStatement("SELECT session_id FROM members WHERE device_id IN ($marks) GROUP BY session_id HAVING COUNT(DISTINCT device_id) = ?").use {
            deviceIds.forEachIndexed { i, d -> it.setString(i + 1, d) }
            it.setInt(deviceIds.size + 1, deviceIds.size)
            it.executeQuery().use { r -> buildList { while (r.next()) add(r.getString(1)) } }
        }
    }

    override suspend fun expiredBefore(now: Long): List<String> = io {
        prepareStatement("SELECT id FROM sessions WHERE expires_at IS NOT NULL AND expires_at <= ?").use {
            it.setLong(1, now)
            it.executeQuery().use { r -> buildList { while (r.next()) add(r.getString(1)) } }
        }
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

    private fun Connection.indexMembers(s: Session) {
        prepareStatement("INSERT OR IGNORE INTO members (session_id, device_id) VALUES (?, ?)").use {
            s.devices.values.toSet().forEach { d -> it.setString(1, s.id); it.setString(2, d); it.addBatch() }
            it.executeBatch()
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
