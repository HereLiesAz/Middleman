package com.hereliesaz.middleman.sms

import com.hereliesaz.middleman.api.MiddlemanClient
import com.hereliesaz.middleman.api.MiddlemanException
import com.hereliesaz.middleman.model.EndReason
import com.hereliesaz.middleman.model.SessionView
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.transformWhile
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.Serializable

/**
 * One person who isn't using the app. [number] never leaves the phone; the server only ever sees
 * [name] and a device id derived from the number.
 *
 * @property sentUpTo id of the last message already texted to them, so a reconnect never repeats one.
 */
@Serializable
data class Bridge(val number: String, val name: String, val token: String, val sessionId: String, val sentUpTo: String? = null)

/** Where bridges survive a process restart. Only what's needed to keep talking; never message text. */
interface BridgeBook {
    fun load(): List<Bridge>
    fun save(bridges: List<Bridge>)
}

/** Sends one text from this phone's own number. */
fun interface SmsOut {
    suspend fun send(number: String, text: String)
}

/**
 * Lets someone without the app take part in a mediation by text.
 *
 * The starter's phone joins the starter's own mediation as a second participant, standing in for the
 * texter. What the texter sends arrives as [incoming] and is said in that participant's room;
 * whatever Middleman says in that room goes back out as a text. Nothing is written anywhere else,
 * and the bridge is forgotten the moment the mediation ends.
 */
class SmsBridge(
    private val scope: CoroutineScope,
    private val client: MiddlemanClient,
    private val out: SmsOut,
    private val book: BridgeBook,
    private val onChange: () -> Unit = {},
) {
    private val bridges = mutableMapOf<String, Bridge>()
    private val watchers = mutableMapOf<String, Job>()
    private val lock = Mutex()

    /** True while any mediation is being carried by text. */
    suspend fun active(): Boolean = lock.withLock { bridges.isNotEmpty() }

    /** Picks up bridges saved before a restart. */
    suspend fun resume() = lock.withLock {
        book.load().forEach { b ->
            val key = PhoneNumbers.key(b.number) ?: return@forEach
            bridges[key] = b
            watch(key, b.token)
        }
        onChange()
    }

    /**
     * Brings [number] into the mediation that [inviteCode] opens. [deviceId] must be stable for this
     * starter and number (a hash, never the number), so a new mediation between the same two replaces the old.
     * The first text tells them what is happening, since they have never heard of any of this.
     */
    suspend fun open(number: String, name: String, inviteCode: String, deviceId: String, starterName: String) {
        val key = PhoneNumbers.key(number) ?: throw IllegalArgumentException("That doesn't look like a phone number.")
        val creds = client.join(inviteCode, name, deviceId)
        val bridge = Bridge(number, name, creds.token, creds.sessionId, client.session(creds.token).room.lastOrNull()?.id)
        lock.withLock {
            watchers.remove(key)?.cancel()
            bridges[key] = bridge
            persist()
            watch(key, bridge.token)
            onChange()
        }
        out.send(number, say("$starterName has asked for space, and is talking to you through me. Reply here. I'll carry what matters and leave the rest."))
    }

    /**
     * A text arrived from [number]. Returns false if nobody is bridged to it, so the caller files it
     * as an ordinary message; true if Middleman took it.
     */
    suspend fun incoming(number: String, text: String): Boolean {
        val key = PhoneNumbers.key(number) ?: return false
        val bridge = lock.withLock { bridges[key] } ?: return false
        try {
            client.say(bridge.token, text)
        } catch (e: CancellationException) {
            throw e
        } catch (e: MiddlemanException) {
            if (e.isFinal) { drop(key, bridge.token); return false }
            out.send(bridge.number, say("I couldn't carry that just now. Say it again in a moment."))
        } catch (e: Exception) {
            out.send(bridge.number, say("I couldn't carry that just now. Say it again in a moment."))
        }
        return true
    }

    private fun watch(key: String, token: String) {
        watchers[key] = scope.launch {
            var backoff = 1_000L
            while (true) {
                try {
                    var more = true
                    client.stream(token).transformWhile { view -> backoff = 1_000L; more = deliver(key, token, view); emit(Unit); more }.collect { }
                    if (!more) return@launch
                } catch (e: CancellationException) {
                    throw e
                } catch (_: Exception) { }
                // The stream may have closed because the mediation is gone; only a definite "gone" ends the bridge.
                try {
                    if (!deliver(key, token, client.session(token))) return@launch
                } catch (e: CancellationException) {
                    throw e
                } catch (e: MiddlemanException) {
                    if (e.isFinal) { drop(key, token); return@launch }
                } catch (_: Exception) { }
                delay(backoff)
                backoff = (backoff * 2).coerceAtMost(30_000)
            }
        }
    }

    /** Texts out anything Middleman has said since the last text. Returns false once the bridge is over. */
    private suspend fun deliver(key: String, token: String, view: SessionView): Boolean {
        val bridge = lock.withLock { bridges[key]?.takeIf { it.token == token } } ?: return false
        view.ending?.let { ending ->
            // A replaced mediation is silent: the same people are already being invited to the next one.
            if (ending.reason != EndReason.REPLACED) out.send(bridge.number, say(ending.note))
            drop(key, token)
            return false
        }
        val room = view.room
        val fresh = room.drop(room.indexOfFirst { it.id == bridge.sentUpTo } + 1)
        for (m in fresh) {
            if (m.authorId == null) out.send(bridge.number, say(m.text))
            advance(key, token, m.id)
        }
        return true
    }

    private suspend fun advance(key: String, token: String, id: String) = lock.withLock {
        bridges[key]?.takeIf { it.token == token }?.let { bridges[key] = it.copy(sentUpTo = id); persist() }
    }

    private suspend fun drop(key: String, token: String) = lock.withLock {
        if (bridges[key]?.token != token) return@withLock
        bridges.remove(key)
        watchers.remove(key)?.cancel()
        persist()
        onChange()
    }

    private fun persist() = book.save(bridges.values.toList())

    /** Every text Middleman sends from someone's own number says so, or it would pass for them. */
    private fun say(text: String) = "Middleman: $text"
}
