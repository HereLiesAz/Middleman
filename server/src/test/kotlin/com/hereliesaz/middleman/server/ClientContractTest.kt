package com.hereliesaz.middleman.server

import com.hereliesaz.middleman.api.MiddlemanClient
import com.hereliesaz.middleman.api.MiddlemanException
import com.hereliesaz.middleman.model.EndReason
import com.hereliesaz.middleman.server.mediation.HeuristicMediator
import com.hereliesaz.middleman.server.store.SqliteSessionStore
import io.ktor.server.testing.testApplication
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.withTimeout
import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

/** The exact client the apps ship, against the real routes, including the live stream to the end. */
class ClientContractTest {
    @Test fun appClientDrivesAMediationToItsEnd() = testApplication {
        val db = File.createTempFile("middleman", ".db").apply { deleteOnExit() }
        val store = SqliteSessionStore(db.path)
        application { middleman(store, MediationService(store, HeuristicMediator, "https://middleman.test")) }
        val api = MiddlemanClient("http://localhost", createClient { })

        val alex = api.create("The dishes", "Alex", "alex-phone-0000000001", expiryDays = 7)
        val code = api.session(alex.token).inviteCode

        val jordan = coroutineScope {
            val sawJordan = async { withTimeout(5_000) { api.stream(alex.token).first { it.participants.size == 2 } } }
            val joined = api.join(code, "Jordan", "jordan-phone-000000001")
            assertEquals("Jordan", sawJordan.await().participants.last().name)
            joined
        }

        api.say(alex.token, "Tell Jordan I feel alone with the chores.")
        assertTrue(api.session(jordan.token).room.single().relayFrom == alex.participantId)

        coroutineScope {
            val alexStream = async { withTimeout(5_000) { api.stream(alex.token).toList() } }
            api.say(jordan.token, "I'm scared about work.")
            api.say(alex.token, "Thank you for understanding. I'm okay now.")
            api.say(jordan.token, "I understand now. We're good.")
            assertEquals(EndReason.RESOLVED, alexStream.await().last().ending?.reason)
        }
        assertFailsWith<MiddlemanException> { api.session(alex.token) }
    }
}
