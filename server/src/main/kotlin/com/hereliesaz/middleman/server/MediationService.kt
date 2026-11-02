package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.model.EndReason
import com.hereliesaz.middleman.model.Ending
import com.hereliesaz.middleman.model.Message
import com.hereliesaz.middleman.model.Participant
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.rules.CleanFight
import com.hereliesaz.middleman.server.mediation.Mediator
import com.hereliesaz.middleman.server.mediation.PrivateContext
import com.hereliesaz.middleman.server.store.Principal
import com.hereliesaz.middleman.server.store.SessionStore
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import java.security.SecureRandom
import java.util.UUID

/**
 * A session changed. [finals] is set when it ended: each participant's last view, carrying the
 * [Ending]. By the time subscribers see it, the session is already deleted.
 */
data class Change(val sessionId: String, val finals: Map<String, SessionView>? = null)

/**
 * Every state change in a mediation goes through here. Routes stay thin; this is the product.
 *
 * The shape: each person has one room with Middleman. Anything meant for the others is relayed in
 * Middleman's words. When Middleman judges everyone settled, or the optional expiry passes, or the
 * same people start a new mediation, the session and everything in it is deleted.
 */
class MediationService(
    private val store: SessionStore,
    private val mediator: Mediator,
    private val publicBaseUrl: String,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    val changes: SharedFlow<Change> get() = _changes
    private val _changes = MutableSharedFlow<Change>(extraBufferCapacity = 64)
    private val random = SecureRandom()

    /** Who Middleman currently judges settled, per session. Lost on restart by design: judgment must be re-earned. */
    private val settled = java.util.concurrent.ConcurrentHashMap<String, Set<String>>()

    suspend fun create(title: String, name: String, deviceId: String, expiryDays: Int?): Pair<Principal, String> {
        require(expiryDays == null || expiryDays in EXPIRY_CHOICES) { "Expiry must be one of $EXPIRY_CHOICES days." }
        val me = participant(name)
        val session = Session(
            id = UUID.randomUUID().toString(),
            title = title.trim().take(TITLE_MAX).ifEmpty { "Untitled" },
            inviteCode = inviteCode(),
            createdAt = clock(),
            starterId = me.id,
            expiresAt = expiryDays?.let { clock() + it * DAY_MS },
            participants = listOf(me),
            devices = mapOf(me.id to device(deviceId)),
        )
        store.create(session)
        val principal = Principal(session.id, me.id)
        return principal to store.issueToken(principal)
    }

    /**
     * Join by invite. A mediation between the same people replaces the old one: any other live
     * session containing both the joiner's device and this session's starter's device is deleted.
     */
    suspend fun join(code: String, name: String, deviceId: String): Pair<Principal, String> {
        val found = store.findByInvite(code) ?: throw NoSuchElementException("No mediation with that code. It may have ended.")
        val dev = device(deviceId)
        val me = participant(name)
        store.update(found.id) { s ->
            require(s.participants.size < MAX_PARTICIPANTS) { "This mediation is full." }
            require(dev !in s.devices.values) { "You're already in this mediation on this device." }
            s.copy(participants = s.participants + me, devices = s.devices + (me.id to dev)) to Unit
        }
        val starterDevice = found.devices.getValue(found.starterId)
        store.sessionsWithAll(setOf(dev, starterDevice)).filter { it != found.id }.forEach { end(it, EndReason.REPLACED) }
        settled.remove(found.id) // a new voice must be heard before anyone is done
        changed(found.id)
        val principal = Principal(found.id, me.id)
        return principal to store.issueToken(principal)
    }

    suspend fun view(p: Principal): SessionView {
        val s = store.get(p.sessionId) ?: throw NoSuchElementException("This mediation has ended.")
        if (s.expiresAt != null && s.expiresAt <= clock()) { end(s.id, EndReason.EXPIRED); throw NoSuchElementException("This mediation has ended.") }
        return s.viewFor(p.participantId, publicBaseUrl)
    }

    /**
     * Two short critical sections around one slow call: the speaker's words land at once, the
     * mediator thinks without holding the session lock, then its reply and any relay are appended to
     * whatever the session has become in the meantime.
     */
    suspend fun say(p: Principal, raw: String): SessionView {
        val text = clean(raw)
        val mine = Message(id(), p.participantId, text, clock(), alerts = CleanFight.check(text))
        lateinit var ctx: PrivateContext
        mutate(p) { s ->
            val me = s.participant(p.participantId)
            val next = s.withMessage(me.id, mine)
            ctx = PrivateContext(
                title = s.title,
                speaker = me,
                isStarter = me.id == s.starterId,
                others = s.others(me.id),
                text = text,
                history = next.room(me.id),
                perspective = s.perspectives[me.id],
                othersNeeds = s.others(me.id).associate { it.name to s.needs[it.id].orEmpty() }.filterValues { it.isNotEmpty() },
                othersPerspectives = s.others(me.id).mapNotNull { o -> s.perspectives[o.id]?.let { o.name to it } }.toMap(),
                commonGround = s.commonGround,
            )
            next
        }

        val counsel = mediator.counsel(ctx)
        val me = p.participantId
        var resolvedNote: String? = null
        val view = mutate(p) { s ->
            var next = s.copy(
                rooms = s.rooms + (me to s.room(me).map { if (it.id == mine.id) it.copy(deliveredAs = counsel.relay, withheld = counsel.withheld) else it }),
                needs = s.needs + (me to (s.needs[me].orEmpty() + counsel.needs).distinctNormalized().takeLast(NEEDS_MAX)),
                commonGround = (s.commonGround + counsel.commonGround).distinctNormalized().takeLast(GROUND_MAX),
                perspectives = s.perspectives + (me to counsel.perspective),
            ).withMessage(me, Message(id(), null, counsel.reply, clock(), insight = counsel.insight))

            counsel.relay?.let { relay ->
                next.others(me).forEach { o -> next = next.withMessage(o.id, Message(id(), null, relay, clock(), relayFrom = me)) }
            }

            val nowSettled = settled.compute(s.id) { _, prev -> (prev.orEmpty() - me) + (if (counsel.settled) setOf(me) else emptySet()) }!!
            if (isResolved(next, nowSettled)) resolvedNote = counsel.closingNote ?: DEFAULT_CLOSING
            next
        }
        resolvedNote?.let { end(p.sessionId, EndReason.RESOLVED, it); return view.copy(ending = Ending(EndReason.RESOLVED, it)) }
        return view
    }

    /** Resolution: at least two people, each heard at least twice, and every one of them judged settled. */
    private fun isResolved(s: Session, settledIds: Set<String>): Boolean =
        s.participants.size >= 2 &&
            s.participants.all { p -> s.room(p.id).count { it.authorId == p.id } >= 2 && p.id in settledIds }

    /** Deletes [sessionId] after sending each participant a final view that explains why. */
    suspend fun end(sessionId: String, reason: EndReason, note: String = defaultNote(reason)) {
        val s = store.get(sessionId) ?: return
        val ending = Ending(reason, note)
        val finals = s.participants.associate { it.id to s.viewFor(it.id, publicBaseUrl, ending) }
        store.delete(sessionId)
        settled.remove(sessionId)
        _changes.emit(Change(sessionId, finals))
    }

    /** Deletes every session whose expiry has passed. Run periodically. */
    suspend fun sweepExpired() = store.expiredBefore(clock()).forEach { end(it, EndReason.EXPIRED) }

    private suspend fun mutate(p: Principal, change: suspend (Session) -> Session): SessionView {
        val view = store.update(p.sessionId) { s ->
            val next = change(s)
            next to next.viewFor(p.participantId, publicBaseUrl)
        }
        changed(p.sessionId)
        return view
    }

    private fun changed(sessionId: String) { _changes.tryEmit(Change(sessionId)) }

    private fun participant(name: String) =
        Participant(id(), name.trim().take(NAME_MAX).also { require(it.isNotEmpty()) { "A name is required." } }, clock())

    private fun device(id: String) = id.trim().also { require(it.length in 16..128) { "Missing device id." } }

    private fun clean(text: String) = text.trim().take(TEXT_MAX).also { require(it.isNotEmpty()) { "Say something first." } }

    private fun id() = UUID.randomUUID().toString()

    private fun inviteCode() = (1..6).map { INVITE_ALPHABET[random.nextInt(INVITE_ALPHABET.length)] }.joinToString("")

    private fun List<String>.distinctNormalized() = distinctBy { it.trim().lowercase() }

    private fun defaultNote(reason: EndReason) = when (reason) {
        EndReason.RESOLVED -> DEFAULT_CLOSING
        EndReason.EXPIRED -> "This mediation reached the end of the time it was given. Everything said in it has been deleted."
        EndReason.REPLACED -> "A new mediation between the same people has started. This one, and everything said in it, has been deleted."
    }

    companion object {
        const val MAX_PARTICIPANTS = 8
        const val TEXT_MAX = 4000
        const val NAME_MAX = 40
        const val TITLE_MAX = 80
        const val NEEDS_MAX = 4
        const val GROUND_MAX = 6
        const val DAY_MS = 86_400_000L
        val EXPIRY_CHOICES = setOf(1, 3, 7, 30)
        const val DEFAULT_CLOSING = "Everyone has been heard. This mediation is over, and everything said in it is being deleted. Talk to each other directly now. Gently."
        /** No 0/O, 1/I/L: codes get read aloud by people who are upset. */
        private const val INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    }
}
