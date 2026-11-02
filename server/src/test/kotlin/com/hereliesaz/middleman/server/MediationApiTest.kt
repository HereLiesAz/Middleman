package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.api.Credentials
import com.hereliesaz.middleman.api.MiddlemanJson
import com.hereliesaz.middleman.api.Routes
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.server.mediation.HeuristicMediator
import com.hereliesaz.middleman.server.store.SqliteSessionStore
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class MediationApiTest {
    private fun withServer(block: suspend ApplicationTestBuilder.(HttpClient) -> Unit) = testApplication {
        val db = File.createTempFile("middleman", ".db").apply { deleteOnExit() }
        val store = SqliteSessionStore(db.path)
        application { middleman(store, MediationService(store, HeuristicMediator)) }
        block(createClient { install(ContentNegotiation) { json(MiddlemanJson) } })
    }

    private suspend fun HttpClient.json(path: String, body: Any, token: String? = null): HttpResponse = post(path) {
        token?.let { bearerAuth(it) }
        contentType(ContentType.Application.Json)
        setBody(body)
    }

    private suspend fun HttpClient.create(name: String) =
        json(Routes.SESSIONS, mapOf("title" to "Dishes", "name" to name)).body<Credentials>()

    private suspend fun HttpClient.join(code: String, name: String) =
        json(Routes.JOIN, mapOf("inviteCode" to code, "name" to name)).body<Credentials>()

    private suspend fun HttpClient.me(token: String) = get(Routes.ME) { bearerAuth(token) }.body<SessionView>()

    private suspend fun HttpClient.say(token: String, text: String) =
        json(Routes.PRIVATE, mapOf("text" to text), token).body<SessionView>()

    /** Enough honest private conversation, across two themes each, to open the joint room. */
    private suspend fun HttpClient.hearOut(a: String, b: String) {
        say(a, "I feel alone with the chores around the house.")
        say(b, "Work has me terrified and I come home late.")
        say(a, "When I talk, it feels like you ignore me.")
        say(b, "Your family visits drain me before I've rested.")
        say(a, "I just want to feel like a team with the dishes.")
        say(b, "I'm late because I'm scared of losing the job.")
    }

    @Test fun privateWordsNeverCrossRooms() = withServer { c ->
        val alex = c.create("Alex")
        val code = c.me(alex.token).inviteCode
        val jordan = c.join(code, "Jordan")

        c.say(alex.token, "Jordan never helps with the dishes and I'm exhausted.")
        val jordanView = c.me(jordan.token)

        assertEquals(listOf("Alex", "Jordan"), jordanView.participants.map { it.name })
        assertTrue(jordanView.privateRoom.isEmpty())
        assertTrue(jordanView.jointRoom.isEmpty())
        assertTrue(jordanView.yourNeeds.isEmpty())
        val leaked = MiddlemanJson.encodeToString(SessionView.serializer(), jordanView)
        assertFalse("exhausted" in leaked, "Alex's private words reached Jordan")
    }

    @Test fun jointRoomLockedUntilEveryoneHeard() = withServer { c ->
        val a = c.create("Alex")
        val b = c.join(c.me(a.token).inviteCode, "Jordan")
        assertEquals(HttpStatusCode.Conflict, c.json(Routes.JOINT, mapOf("text" to "hi"), a.token).status)

        c.hearOut(a.token, b.token)
        val view = c.me(a.token)
        assertTrue(view.jointUnlocked, view.readiness.toString())

        // A third person arrives: the room closes until they've been heard too.
        c.join(view.inviteCode, "Sam")
        assertFalse(c.me(a.token).jointUnlocked)
    }

    @Test fun cruelMessagesAreHeldFromOthers() = withServer { c ->
        val a = c.create("Alex")
        val b = c.join(c.me(a.token).inviteCode, "Jordan")
        c.hearOut(a.token, b.token)

        val mine = c.json(Routes.JOINT, mapOf("text" to "You're a selfish idiot."), a.token).body<SessionView>()
        assertTrue(mine.jointRoom.any { it.held && it.text.contains("selfish") })
        assertTrue(c.me(b.token).jointRoom.none { "selfish" in it.text })

        c.json(Routes.JOINT, mapOf("text" to "I felt invisible on Friday."), a.token)
        assertTrue(c.me(b.token).jointRoom.any { it.text == "I felt invisible on Friday." })
    }

    @Test fun bridgeDeliversOnlyWithConsent() = withServer { c ->
        val a = c.create("Alex")
        val b = c.join(c.me(a.token).inviteCode, "Jordan")
        val view = c.say(a.token, "I always do the chores and it's crushing me.")
        assertTrue(c.me(b.token).privateRoom.isEmpty())

        val reply = view.privateRoom.last { it.authorId == null }
        c.json(Routes.BRIDGE, mapOf("messageId" to reply.id), a.token)
        c.json(Routes.BRIDGE, mapOf("messageId" to reply.id), a.token) // idempotent

        val delivered = c.me(b.token).privateRoom
        assertEquals(1, delivered.size)
        assertEquals(a.participantId, delivered.single().onBehalfOf)
        assertFalse("crushing" in delivered.single().text)
    }

    @Test fun tokensAreRequiredAndScoped() = withServer { c ->
        assertEquals(HttpStatusCode.Unauthorized, c.get(Routes.ME).status)
        assertEquals(HttpStatusCode.Unauthorized, c.get(Routes.ME) { bearerAuth("forged") }.status)
        assertEquals(HttpStatusCode.NotFound, c.json(Routes.JOIN, mapOf("inviteCode" to "NOPE00", "name" to "X")).status)
    }

    @Test fun timeoutBlocksJointRoom() = withServer { c ->
        val a = c.create("Alex")
        val b = c.join(c.me(a.token).inviteCode, "Jordan")
        c.hearOut(a.token, b.token)
        c.json(Routes.TIMEOUT, emptyMap<String, String>(), b.token)
        assertEquals(HttpStatusCode.Conflict, c.json(Routes.JOINT, mapOf("text" to "but"), a.token).status)
    }
}
