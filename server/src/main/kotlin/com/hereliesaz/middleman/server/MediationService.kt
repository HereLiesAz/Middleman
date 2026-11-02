package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.model.Message
import com.hereliesaz.middleman.model.Participant
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.model.Timeout
import com.hereliesaz.middleman.rules.CleanFight
import com.hereliesaz.middleman.server.mediation.JointContext
import com.hereliesaz.middleman.server.mediation.Mediator
import com.hereliesaz.middleman.server.mediation.PrivateContext
import com.hereliesaz.middleman.server.store.Principal
import com.hereliesaz.middleman.server.store.SessionStore
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import java.security.SecureRandom
import java.util.UUID

/** A rule of the room was broken by the request itself. Maps to HTTP 409. */
class RoomRuleException(message: String) : Exception(message)

/**
 * Every state change in a mediation goes through here. Routes stay thin; this is the product logic.
 */
class MediationService(
    private val store: SessionStore,
    private val mediator: Mediator,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    /** Emits a session id whenever that session changes. WebSocket subscribers re-render from it. */
    val changes: SharedFlow<String> get() = _changes
    private val _changes = MutableSharedFlow<String>(extraBufferCapacity = 64)
    private val random = SecureRandom()

    suspend fun create(title: String, name: String): Pair<Principal, String> {
        val me = participant(name)
        val session = Session(
            id = UUID.randomUUID().toString(),
            title = title.trim().take(TITLE_MAX).ifEmpty { "Untitled disagreement" },
            inviteCode = inviteCode(),
            createdAt = clock(),
            participants = listOf(me),
        )
        store.create(session)
        val principal = Principal(session.id, me.id)
        return principal to store.issueToken(principal)
    }

    suspend fun join(code: String, name: String): Pair<Principal, String> {
        val found = store.findByInvite(code) ?: throw NoSuchElementException("No mediation with that code.")
        val me = participant(name)
        store.update(found.id) { s ->
            require(s.participants.size < MAX_PARTICIPANTS) { "This mediation is full." }
            // A new voice hasn't been heard yet; the joint room closes until they have.
            s.copy(participants = s.participants + me, jointUnlocked = false) to Unit
        }
        changed(found.id)
        val principal = Principal(found.id, me.id)
        return principal to store.issueToken(principal)
    }

    suspend fun view(p: Principal): SessionView =
        (store.get(p.sessionId) ?: throw NoSuchElementException("Session ended.")).viewFor(p.participantId, clock())

    /**
     * Two short critical sections around one slow call: the speaker's words land (and stream to
     * their own devices) at once, the mediator thinks without holding the session lock, then the
     * reply is appended to whatever the session has become in the meantime.
     */
    suspend fun sayPrivately(p: Principal, raw: String): SessionView {
        val text = clean(raw)
        lateinit var ctx: PrivateContext
        mutate(p) { s ->
            val me = s.participant(p.participantId)
            val next = s.copy(privateRooms = s.privateRooms + (me.id to s.room(me.id) + Message(id(), me.id, text, clock(), alerts = CleanFight.check(text))))
            ctx = PrivateContext(
                title = s.title,
                speaker = me,
                others = s.others(me.id),
                text = text,
                history = next.room(me.id),
                perspective = s.perspectives[me.id],
                othersNeeds = s.others(me.id).associate { it.name to s.needs[it.id].orEmpty() }.filterValues { it.isNotEmpty() },
                commonGround = s.commonGround,
            )
            next
        }
        val counsel = mediator.counsel(ctx)
        return mutate(p) { s ->
            val me = p.participantId
            val next = s.copy(
                privateRooms = s.privateRooms + (me to s.room(me) + Message(id(), null, counsel.reply, clock(), insight = counsel.insight)),
                needs = s.needs + (me to (s.needs[me].orEmpty() + counsel.needs).distinctNormalized().takeLast(NEEDS_MAX)),
                commonGround = (s.commonGround + counsel.commonGround).distinctNormalized().takeLast(GROUND_MAX),
                perspectives = s.perspectives + (me to counsel.perspective),
            )
            next.copy(jointUnlocked = next.jointUnlocked || next.readiness().ready)
        }
    }

    /**
     * A message that breaks a holding rule never enters the shared transcript: it is stored visible
     * only to its author, followed by private coaching. Anything else is posted, and Middleman may
     * add a facilitating aside.
     */
    suspend fun sayToEveryone(p: Principal, raw: String): SessionView {
        val text = clean(raw)
        val alerts = CleanFight.check(text)
        val held = alerts.any { it.holds }
        lateinit var ctx: JointContext
        mutate(p) { s ->
            if (!s.jointUnlocked) throw RoomRuleException("The joint room isn't open yet.")
            s.activeTimeout(clock())?.let { throw RoomRuleException("${s.participant(it.calledBy).name} called a timeout. Breathe first.") }
            val me = s.participant(p.participantId)
            ctx = JointContext(
                speaker = me,
                others = s.others(me.id),
                text = text,
                alerts = alerts,
                recent = s.jointRoom.filter { it.visibleTo == null }.map { (it.authorId?.let(s::participant)?.name ?: "Middleman") to it.text },
            )
            val msg = Message(id(), me.id, text, clock(), alerts = alerts, visibleTo = me.id.takeIf { held }, held = held)
            s.copy(jointRoom = s.jointRoom + msg)
        }
        val aside = if (held) mediator.reframe(ctx) else mediator.facilitate(ctx)
        return mutate(p) { s ->
            if (aside == null) s
            else s.copy(jointRoom = s.jointRoom + Message(id(), null, aside, clock(), visibleTo = p.participantId.takeIf { held }))
        }
    }

    /** Deliver Middleman's suggested bridge from [p]'s room to everyone else's, with [p]'s consent. */
    suspend fun bridge(p: Principal, messageId: String): SessionView = mutate(p) { s ->
        val room = s.room(p.participantId)
        val source = room.firstOrNull { it.id == messageId && it.authorId == null }
            ?: throw NoSuchElementException("Nothing to deliver.")
        val bridge = source.insight?.bridge ?: throw RoomRuleException("Middleman has nothing ready to deliver yet.")
        if (source.bridged) return@mutate s

        val delivered = s.others(p.participantId).associate { o ->
            o.id to s.room(o.id) + Message(id(), null, bridge, clock(), onBehalfOf = p.participantId)
        }
        s.copy(privateRooms = s.privateRooms + delivered + (p.participantId to room.map { if (it.id == messageId) it.copy(bridged = true) else it }))
    }

    suspend fun timeout(p: Principal): SessionView = mutate(p) { s ->
        val me = s.participant(p.participantId)
        val announce = Message(
            id(), null,
            "${me.name} called a timeout. Sixty seconds. In for four, hold for four, out for four, hold for four. Nobody is in trouble.",
            clock(),
        )
        s.copy(timeout = Timeout(me.id, clock() + TIMEOUT_MS), jointRoom = s.jointRoom + announce)
    }

    private suspend fun mutate(p: Principal, change: suspend (Session) -> Session): SessionView {
        val view = store.update(p.sessionId) { s ->
            val next = change(s)
            next to next.viewFor(p.participantId, clock())
        }
        changed(p.sessionId)
        return view
    }

    private fun changed(sessionId: String) { _changes.tryEmit(sessionId) }

    private fun participant(name: String) =
        Participant(id(), name.trim().take(NAME_MAX).also { require(it.isNotEmpty()) { "A name is required." } }, clock())

    private fun clean(text: String) = text.trim().take(TEXT_MAX).also { require(it.isNotEmpty()) { "Say something first." } }

    private fun id() = UUID.randomUUID().toString()

    private fun inviteCode() = (1..6).map { INVITE_ALPHABET[random.nextInt(INVITE_ALPHABET.length)] }.joinToString("")

    private fun List<String>.distinctNormalized() = distinctBy { it.trim().lowercase() }

    companion object {
        const val MAX_PARTICIPANTS = 8
        const val TEXT_MAX = 4000
        const val NAME_MAX = 40
        const val TITLE_MAX = 80
        const val NEEDS_MAX = 4
        const val GROUND_MAX = 6
        const val TIMEOUT_MS = 60_000L
        /** No 0/O, 1/I/L: codes get read aloud across a room by people who are upset. */
        private const val INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    }
}
