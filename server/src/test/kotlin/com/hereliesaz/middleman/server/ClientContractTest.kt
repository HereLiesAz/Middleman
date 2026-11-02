package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.api.MiddlemanClient
import com.hereliesaz.middleman.api.MiddlemanException
import com.hereliesaz.middleman.server.mediation.HeuristicMediator
import com.hereliesaz.middleman.server.store.SqliteSessionStore
import io.ktor.server.testing.testApplication
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withTimeout
import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

/** The exact client the apps ship, against the real routes, including the live stream. */
class ClientContractTest {
    @Test fun appClientDrivesAWholeMediation() = testApplication {
        val db = File.createTempFile("middleman", ".db").apply { deleteOnExit() }
        val store = SqliteSessionStore(db.path)
        application { middleman(store, MediationService(store, HeuristicMediator)) }
        val api = MiddlemanClient("http://localhost", createClient { })

        val alex = api.create("The dishes", "Alex")
        val code = api.session(alex.token).inviteCode

        // Alex is watching the live stream when Jordan walks in.
        val jordan = coroutineScope {
        val sawJordan = async { withTimeout(5_000) { api.stream(alex.token).first { it.participants.size == 2 } } }
        val joined = api.join(code, "Jordan")
        assertEquals("Jordan", sawJordan.await().participants.last().name)
        joined
        }

        val after = api.sayPrivately(alex.token, "I'm worn out doing the chores alone.")
        assertTrue(after.privateRoom.last().insight != null)
        assertTrue(api.session(jordan.token).privateRoom.isEmpty())

        assertFailsWith<MiddlemanException> { api.sayToEveryone(jordan.token, "hello") }
        assertFailsWith<MiddlemanException> { api.session("forged") }
    }
}
