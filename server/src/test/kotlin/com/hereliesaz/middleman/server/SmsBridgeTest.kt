package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.api.MiddlemanClient
import com.hereliesaz.middleman.server.mediation.HeuristicMediator
import com.hereliesaz.middleman.server.store.SqliteSessionStore
import com.hereliesaz.middleman.sms.Bridge
import com.hereliesaz.middleman.sms.BridgeBook
import com.hereliesaz.middleman.sms.SmsBridge
import com.hereliesaz.middleman.sms.SmsOut
import io.ktor.server.testing.testApplication
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeout
import java.io.File
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** Someone without the app, carried by the starter's phone, through the real routes to the end. */
class SmsBridgeTest {
    private class Texts : SmsOut {
        val sent = CopyOnWriteArrayList<Pair<String, String>>()
        override suspend fun send(number: String, text: String) { sent += number to text }
    }

    private class MemoryBook : BridgeBook {
        var saved: List<Bridge> = emptyList()
        override fun load() = saved
        override fun save(bridges: List<Bridge>) { saved = bridges }
    }

    private suspend fun until(what: String, check: () -> Boolean) {
        try {
            withTimeout(5_000) { while (!check()) delay(25) }
        } catch (e: kotlinx.coroutines.TimeoutCancellationException) {
            error("never happened: $what")
        }
    }

    @Test fun aTexterTakesPartAndTheBridgeEndsWithTheMediation() = testApplication {
        val db = File.createTempFile("middleman", ".db").apply { deleteOnExit() }
        val store = SqliteSessionStore(db.path)
        application { middleman(store, MediationService(store, HeuristicMediator, "https://middleman.test")) }
        val api = MiddlemanClient("http://localhost", createClient { })
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
        val texts = Texts()
        val book = MemoryBook()
        val bridge = SmsBridge(scope, api, texts, book)
        val number = "+1 (504) 555-0100"

        val alex = api.create("The dishes", "Alex", "alex-phone-0000000001", expiryDays = null)
        bridge.open(number, "Jordan", api.session(alex.token).inviteCode, "sms-0000000000000001", "Alex")

        assertTrue(bridge.active())
        assertTrue(texts.sent.single().second.startsWith("Middleman: Alex has asked for space"))
        assertEquals(number, book.saved.single().number)
        assertFalse(bridge.incoming("5045559999", "who is this"), "an unbridged number is an ordinary text")

        api.say(alex.token, "Tell Jordan I feel alone with the chores.")
        until("the relay reaches Jordan by text") { texts.sent.size >= 2 }
        assertTrue(texts.sent.last().second.startsWith("Middleman: "))

        assertTrue(bridge.incoming("5045550100", "I'm scared about work."))
        api.say(alex.token, "Thank you for understanding. I'm okay now.")
        assertTrue(bridge.incoming("+15045550100", "I understand now. We're good."))

        until("the bridge ends with the mediation") { texts.sent.any { "deleted" in it.second } }
        until("the bridge is forgotten") { book.saved.isEmpty() }
        assertFalse(bridge.active())
        assertFalse(bridge.incoming(number, "still there?"))
        scope.cancel()
    }
}
