package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.api.CreateSessionRequest
import com.hereliesaz.middleman.api.Credentials
import com.hereliesaz.middleman.api.MiddlemanJson
import com.hereliesaz.middleman.api.Routes
import com.hereliesaz.middleman.model.EndReason
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
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import java.io.File
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class MediationApiTest {
    private var now = 1_000_000L
    private lateinit var service: MediationService

    private fun withServer(block: suspend ApplicationTestBuilder.(HttpClient) -> Unit) = testApplication {
        val db = File.createTempFile("middleman", ".db").apply { deleteOnExit() }
        val store = SqliteSessionStore(db.path)
        service = MediationService(store, HeuristicMediator, "https://middleman.test", clock = { now })
        application { middleman(store, service, androidCertSha256 = listOf("AA:BB"), appleAppIds = listOf("TEAM123.com.hereliesaz.middleman")) }
        block(createClient { install(ContentNegotiation) { json(MiddlemanJson) } })
    }

    private fun device() = UUID.randomUUID().toString()

    private suspend fun HttpClient.json(path: String, body: Any, token: String? = null): HttpResponse = post(path) {
        token?.let { bearerAuth(it) }
        contentType(ContentType.Application.Json)
        setBody(body)
    }

    private suspend fun HttpClient.create(name: String, dev: String = device(), expiryDays: Int? = null) =
        json(Routes.SESSIONS, CreateSessionRequest("Dishes", name, dev, expiryDays)).body<Credentials>()

    private suspend fun HttpClient.join(code: String, name: String, dev: String = device()) =
        json(Routes.JOIN, mapOf("inviteCode" to code, "name" to name, "deviceId" to dev)).body<Credentials>()

    private suspend fun HttpClient.me(token: String) = get(Routes.ME) { bearerAuth(token) }.body<SessionView>()

    private suspend fun HttpClient.say(token: String, text: String) =
        json(Routes.SAY, mapOf("text" to text), token).body<SessionView>()

    private suspend fun HttpClient.pair(): Pair<Credentials, Credentials> {
        val a = create("Alex")
        return a to join(me(a.token).inviteCode, "Jordan")
    }

    @Test fun privateWordsStayPrivate() = withServer { c ->
        val (a, b) = c.pair()
        c.say(a.token, "I'm exhausted and nobody helps with the dishes.")
        val jordan = c.me(b.token)
        assertTrue(jordan.room.isEmpty())
        assertFalse("exhausted" in MiddlemanJson.encodeToString(SessionView.serializer(), jordan))
        assertEquals("https://middleman.test/j/${jordan.inviteCode}", jordan.link)
    }

    @Test fun relaysAreParaphrasedNotForwarded() = withServer { c ->
        val (a, b) = c.pair()
        val mine = c.say(a.token, "Tell Jordan he never helps with the chores and I'm sick of it.").room.first { it.authorId == a.participantId }
        val delivered = assertNotNull(mine.deliveredAs)

        val relay = c.me(b.token).room.single()
        assertEquals(a.participantId, relay.relayFrom)
        assertEquals(delivered, relay.text)
        assertFalse("sick of it" in relay.text)
        assertFalse("never" in relay.text.lowercase())
    }

    @Test fun pureAbuseIsWithheld() = withServer { c ->
        val (a, b) = c.pair()
        val mine = c.say(a.token, "Tell Jordan he's a worthless idiot.").room.first { it.authorId == a.participantId }
        assertNull(mine.deliveredAs)
        assertNotNull(mine.withheld)
        assertTrue(c.me(b.token).room.isEmpty())
    }

    @Test fun resolutionDeletesEverything() = withServer { c ->
        val (a, b) = c.pair()
        c.say(a.token, "I feel alone with the chores.")
        c.say(b.token, "Work has me scared.")
        c.say(a.token, "Thank you for understanding. I'm okay now.")
        val last = c.say(b.token, "I understand now. We're good.")

        assertEquals(EndReason.RESOLVED, last.ending?.reason)
        assertEquals(HttpStatusCode.Unauthorized, c.get(Routes.ME) { bearerAuth(a.token) }.status)
        assertEquals(HttpStatusCode.NotFound, c.json(Routes.JOIN, mapOf("inviteCode" to last.inviteCode, "name" to "X", "deviceId" to device())).status)
    }

    @Test fun oneSettledPersonIsNotResolution() = withServer { c ->
        val (a, b) = c.pair()
        c.say(a.token, "I feel alone with the chores.")
        c.say(b.token, "You're selfish and I'm still furious.")
        c.say(a.token, "I'm okay now.")
        assertNull(c.say(b.token, "No. Still angry about work.").ending)
    }

    @Test fun newMediationBetweenSamePeopleReplacesOld() = withServer { c ->
        val alexPhone = device(); val jordanPhone = device(); val samPhone = device()
        val old = c.create("Alex", alexPhone)
        c.join(c.me(old.token).inviteCode, "Jordan", jordanPhone)
        val unrelated = c.create("Sam", samPhone)

        val fresh = c.create("Alex", alexPhone)
        c.join(c.me(fresh.token).inviteCode, "Jordan", jordanPhone)

        assertEquals(HttpStatusCode.Unauthorized, c.get(Routes.ME) { bearerAuth(old.token) }.status)
        assertEquals(HttpStatusCode.OK, c.get(Routes.ME) { bearerAuth(fresh.token) }.status)
        assertEquals(HttpStatusCode.OK, c.get(Routes.ME) { bearerAuth(unrelated.token) }.status)
    }

    @Test fun expiryDeletes() = withServer { c ->
        val a = c.create("Alex", expiryDays = 1)
        assertNotNull(c.me(a.token).expiresAt)
        now += MediationService.DAY_MS + 1
        service.sweepExpired()
        assertEquals(HttpStatusCode.Unauthorized, c.get(Routes.ME) { bearerAuth(a.token) }.status)
        assertEquals(HttpStatusCode.BadRequest, c.json(Routes.SESSIONS, CreateSessionRequest("t", "n", device(), 2)).status)
    }

    @Test fun tokensAreRequired() = withServer { c ->
        assertEquals(HttpStatusCode.Unauthorized, c.get(Routes.ME).status)
        assertEquals(HttpStatusCode.Unauthorized, c.get(Routes.ME) { bearerAuth("forged") }.status)
    }

    @Test fun appLinksAreDeclared() = withServer { c ->
        val body = c.get("/.well-known/assetlinks.json").bodyAsText()
        assertTrue("com.hereliesaz.middleman" in body && "AA:BB" in body, body)
        val apple = c.get("/.well-known/apple-app-site-association").bodyAsText()
        assertTrue("TEAM123.com.hereliesaz.middleman" in apple && "/j/*" in apple, apple)
    }
}
