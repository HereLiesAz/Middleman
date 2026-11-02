package com.hereliesaz.middleman.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.Surface
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.hereliesaz.middleman.KeyValueStore
import com.hereliesaz.middleman.MiddlemanViewModel

/** Root of every platform. Platforms differ only in [store] and the server they default to. */
@Composable
fun App(store: KeyValueStore, defaultServer: String) = MiddlemanTheme {
    val vm = viewModel { MiddlemanViewModel(store, defaultServer) }
    val state by vm.state.collectAsStateWithLifecycle()
    var showingExamples by remember { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(state.error) {
        state.error?.let { snackbar.showSnackbar(it); vm.dismissError() }
    }

    Surface(Modifier.fillMaxSize(), color = Ink.Void, contentColor = Ink.Light) {
    Box(Modifier.fillMaxSize().safeDrawingPadding()) {
        val session = state.session
        when {
            showingExamples -> ExamplesScreen(onBack = { showingExamples = false })
            !state.signedIn -> ThresholdScreen(state, vm, onExamples = { showingExamples = true })
            session == null -> CircularProgressIndicator(Modifier.align(Alignment.Center), color = Ink.Bone)
            else -> SessionScreen(session, state, vm)
        }
        SnackbarHost(snackbar, Modifier.align(Alignment.BottomCenter))
    }
    }
}
