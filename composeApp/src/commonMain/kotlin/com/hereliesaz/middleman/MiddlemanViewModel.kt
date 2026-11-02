package com.hereliesaz.middleman

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hereliesaz.middleman.api.Credentials
import com.hereliesaz.middleman.api.MiddlemanClient
import com.hereliesaz.middleman.api.MiddlemanException
import com.hereliesaz.middleman.model.SessionView
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class UiState(
    val serverUrl: String,
    val signedIn: Boolean = false,
    val session: SessionView? = null,
    val busy: Boolean = false,
    val error: String? = null,
    val connected: Boolean = false,
)

/**
 * Single source of truth for the app. Credentials survive restarts via [store]; the session
 * itself is never cached on the device, only re-fetched, so a lost phone leaks a token, not a fight.
 */
class MiddlemanViewModel(private val store: KeyValueStore, defaultServer: String) : ViewModel() {
    private val _state = MutableStateFlow(UiState(serverUrl = store[KEY_SERVER] ?: defaultServer))
    val state: StateFlow<UiState> = _state

    private var client = MiddlemanClient(_state.value.serverUrl)
    private var token: String? = store[KEY_TOKEN]
    private var streamJob: Job? = null

    init { token?.let { startStreaming(it) } }

    fun setServer(url: String) {
        store[KEY_SERVER] = url
        client = MiddlemanClient(url)
        _state.update { it.copy(serverUrl = url) }
    }

    fun create(title: String, name: String) = act { signIn(client.create(title, name)) }
    fun join(code: String, name: String) = act { signIn(client.join(code, name)) }
    fun sayPrivately(text: String) = act { show(client.sayPrivately(requireToken(), text)) }
    fun sayToEveryone(text: String) = act { show(client.sayToEveryone(requireToken(), text)) }
    fun bridge(messageId: String) = act { show(client.bridge(requireToken(), messageId)) }
    fun timeout() = act { show(client.timeout(requireToken())) }
    fun dismissError() = _state.update { it.copy(error = null) }

    fun leave() {
        streamJob?.cancel()
        token = null
        store[KEY_TOKEN] = null
        _state.update { UiState(serverUrl = it.serverUrl) }
    }

    private fun signIn(c: Credentials) {
        token = c.token
        store[KEY_TOKEN] = c.token
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
                        _state.update { it.copy(session = view, connected = true) }
                    }
                } catch (e: MiddlemanException) {
                    leave(); _state.update { it.copy(error = e.message) }; return@launch
                } catch (e: Exception) {
                    if (e is kotlinx.coroutines.CancellationException) throw e
                }
                _state.update { it.copy(connected = false) }
                // The stream may have dropped because the token is gone; ask once before retrying.
                runCatching { show(client.session(t)) }.onFailure { if (it is MiddlemanException) { leave(); return@launch } }
                delay(backoff)
                backoff = (backoff * 2).coerceAtMost(30_000)
            }
        }
    }

    private fun show(view: SessionView) = _state.update { it.copy(session = view) }

    private fun requireToken() = token ?: throw MiddlemanException("Not in a mediation.")

    private fun act(block: suspend () -> Unit) {
        if (_state.value.busy) return
        viewModelScope.launch {
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
    }

    private companion object {
        const val KEY_SERVER = "server"
        const val KEY_TOKEN = "token"
    }
}
