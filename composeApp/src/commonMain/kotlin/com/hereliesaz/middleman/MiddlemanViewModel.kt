package com.hereliesaz.middleman

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hereliesaz.middleman.api.Credentials
import com.hereliesaz.middleman.api.MiddlemanClient
import com.hereliesaz.middleman.api.MiddlemanException
import com.hereliesaz.middleman.model.Ending
import com.hereliesaz.middleman.model.SessionView
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

data class UiState(
    val serverUrl: String,
    val inviteCode: String? = null,
    val signedIn: Boolean = false,
    val session: SessionView? = null,
    /** The last words of a mediation that has just been deleted. Held only in memory. */
    val ending: Ending? = null,
    val busy: Boolean = false,
    val error: String? = null,
    val connected: Boolean = false,
)

/**
 * Single source of truth for the app. Only the token and an anonymous device id survive restarts.
 * The session itself is never written to the device; when it ends, it's gone.
 */
@OptIn(ExperimentalUuidApi::class)
class MiddlemanViewModel(
    private val store: KeyValueStore,
    defaultServer: String,
    inviteCode: String?,
    val textBridge: TextBridge? = null,
) : ViewModel() {
    private val _state = MutableStateFlow(UiState(serverUrl = store[KEY_SERVER] ?: defaultServer, inviteCode = inviteCode))
    val state: StateFlow<UiState> = _state

    /** Lets the server recognize "the same people" across mediations, without knowing who anyone is. */
    private val deviceId: String = store[KEY_DEVICE] ?: Uuid.random().toString().also { store[KEY_DEVICE] = it }
    private var client = MiddlemanClient(_state.value.serverUrl)
    private var token: String? = store[KEY_TOKEN]
    private var streamJob: Job? = null
    /** In-flight requests. Cancelled on leave so a late reply from an old mediation can't paint over a new one. */
    private val actions = mutableSetOf<Job>()
    /** Which mediation the current token belongs to; views from any other are ignored. */
    private var sessionId: String? = null

    init { token?.let { startStreaming(it) } }

    fun setServer(url: String) {
        store[KEY_SERVER] = url
        client = MiddlemanClient(url)
        _state.update { it.copy(serverUrl = url) }
    }

    /**
     * Starts a mediation. With [theirNumber] and a [textBridge], also brings that person in by text;
     * if that part fails the mediation still stands, and the error says so.
     */
    fun create(title: String, name: String, expiryDays: Int?, theirNumber: String? = null, theirName: String? = null) = act {
        signIn(client.create(title, name, deviceId, expiryDays))
        val bridge = textBridge
        if (bridge != null && !theirNumber.isNullOrBlank()) {
            val code = client.session(requireToken()).inviteCode
            try {
                bridge.open(theirNumber, theirName?.takeIf { it.isNotBlank() } ?: "Them", code, name)
            } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
                _state.update { it.copy(error = "Started, but couldn't text them: ${e.message ?: "unknown error"}. Send them the link instead.") }
            }
        }
    }
    fun join(code: String, name: String) = act { signIn(client.join(code, name, deviceId)) }
    fun say(text: String) = act { show(client.say(requireToken(), text)) }
    fun dismissError() = _state.update { it.copy(error = null) }
    fun dismissEnding() = _state.update { it.copy(ending = null) }

    fun leave() = forget(null)

    private fun forget(ending: Ending?) {
        streamJob?.cancel()
        actions.toList().forEach { it.cancel() }
        token = null
        sessionId = null
        store[KEY_TOKEN] = null
        _state.update { UiState(serverUrl = it.serverUrl, ending = ending) }
    }

    private fun signIn(c: Credentials) {
        token = c.token
        sessionId = c.sessionId
        store[KEY_TOKEN] = c.token
        _state.update { it.copy(inviteCode = null) }
        startStreaming(c.token)
    }

    private fun startStreaming(t: String) {
        _state.update { it.copy(signedIn = true) }
        streamJob?.cancel()
        streamJob = viewModelScope.launch {
            var backoff = 1_000L
            while (true) {
                try {
                    client.stream(t).collect { view ->
                        backoff = 1_000L
                        show(view)
                        _state.update { it.copy(connected = true) }
                    }
                } catch (e: Exception) {
                    if (e is kotlinx.coroutines.CancellationException) throw e
                }
                if (token == null) return@launch
                _state.update { it.copy(connected = false) }
                // The stream may have dropped because the mediation is gone; ask once before retrying.
                // Only a definite "gone" clears the token; outages and proxy errors just retry.
                runCatching { show(client.session(t)) }.onFailure {
                    if (it is MiddlemanException && it.isFinal) {
                        forget(Ending(com.hereliesaz.middleman.model.EndReason.RESOLVED, "This mediation has ended. Everything said in it has been deleted."))
                        return@launch
                    }
                }
                delay(backoff)
                backoff = (backoff * 2).coerceAtMost(30_000)
            }
        }
    }

    private fun show(view: SessionView) {
        if (sessionId != null && view.sessionId != sessionId) return
        if (sessionId == null) sessionId = view.sessionId
        view.ending?.let { forget(it); return }
        _state.update { it.copy(session = view) }
    }

    private fun requireToken() = token ?: throw MiddlemanException("Not in a mediation.")

    private fun act(block: suspend () -> Unit) {
        if (_state.value.busy) return
        val job = viewModelScope.launch {
            _state.update { it.copy(busy = true, error = null) }
            try {
                block()
            } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
                _state.update { it.copy(error = e.message ?: "Couldn't reach Middleman.") }
            } finally {
                _state.update { it.copy(busy = false) }
            }
        }
        actions += job
        job.invokeOnCompletion { actions -= job }
    }

    private companion object {
        const val KEY_SERVER = "server"
        const val KEY_TOKEN = "token"
        const val KEY_DEVICE = "device"
    }
}
