package com.hereliesaz.middleman.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.hereliesaz.middleman.MiddlemanViewModel
import com.hereliesaz.middleman.UiState

private enum class Door { START, JOIN }

/** The way in. Start a mediation and hand out the code, or walk in with one. */
@Composable
fun ThresholdScreen(state: UiState, vm: MiddlemanViewModel, onExamples: () -> Unit) {
    var door by remember { mutableStateOf(Door.START) }
    var name by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var editingServer by remember { mutableStateOf(false) }
    var server by remember(state.serverUrl) { mutableStateOf(state.serverUrl) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Column(Modifier.widthIn(max = 440.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("MIDDLEMAN", style = MaterialTheme.typography.displayLarge, maxLines = 1, softWrap = false)
            Spacer(Modifier.height(16.dp))
            Text(
                "Say it to me first.\nI'll make sure it arrives as what you meant.",
                style = MiddlemanAside, textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(48.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                Tab("START ONE", door == Door.START) { door = Door.START }
                Tab("JOIN ONE", door == Door.JOIN) { door = Door.JOIN }
            }
            Spacer(Modifier.height(24.dp))

            Field(name, { name = it }, "Your name", capitalization = KeyboardCapitalization.Words)
            Spacer(Modifier.height(12.dp))
            if (door == Door.START) {
                Field(title, { title = it }, "What's it about? (only a title)", capitalization = KeyboardCapitalization.Sentences)
                Spacer(Modifier.height(28.dp))
                Solemn("BEGIN", enabled = name.isNotBlank() && !state.busy) { vm.create(title, name) }
                Spacer(Modifier.height(12.dp))
                Text(
                    "You'll get a code. Give it to everyone else in this. Each of you talks to me alone until it's safe to talk to each other.",
                    style = MaterialTheme.typography.bodyMedium, color = Ink.Fog, textAlign = TextAlign.Center,
                )
            } else {
                Field(code, { code = it.uppercase().filter(Char::isLetterOrDigit).take(6) }, "Invite code", capitalization = KeyboardCapitalization.Characters)
                Spacer(Modifier.height(28.dp))
                Solemn("ENTER", enabled = name.isNotBlank() && code.length == 6 && !state.busy) { vm.join(code, name) }
            }

            Spacer(Modifier.height(48.dp))
            TextButton(onClick = onExamples) { Text("How it works", color = Ink.Bone) }
            TextButton(onClick = { editingServer = !editingServer }) {
                Text("Server: ${state.serverUrl}", style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
            }
            if (editingServer) {
                Field(server, { server = it }, "Server URL", keyboard = KeyboardOptions(autoCorrectEnabled = false))
                TextButton(onClick = { vm.setServer(server.trim()); editingServer = false }) { Text("Save", color = Ink.Light) }
            }
        }
    }
}
