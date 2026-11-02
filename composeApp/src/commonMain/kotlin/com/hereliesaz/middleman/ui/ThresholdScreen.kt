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
import com.hereliesaz.middleman.api.inviteCodeFrom

private enum class Door { START, JOIN }

/** The way in. Start a mediation and hand out the code, or walk in with one. */
@Composable
fun ThresholdScreen(state: UiState, vm: MiddlemanViewModel, onExamples: () -> Unit) {
    var door by remember { mutableStateOf(if (state.inviteCode != null) Door.JOIN else Door.START) }
    var name by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }
    var code by remember { mutableStateOf(state.inviteCode.orEmpty()) }
    var expiry by remember { mutableStateOf<Int?>(null) }
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
                "Talk to me, not at each other.\nI'll carry what matters, and leave the rest.",
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
                Spacer(Modifier.height(20.dp))
                Text("DELETE IT ANYWAY AFTER", style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
                Row(Modifier.padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                    listOf(null to "NEVER", 1 to "1 DAY", 3 to "3", 7 to "7", 30 to "30").forEach { (days, label) ->
                        Tab(label, expiry == days) { expiry = days }
                    }
                }
                Spacer(Modifier.height(28.dp))
                Solemn("ASK FOR SPACE", enabled = name.isNotBlank() && !state.busy) { vm.create(title, name, expiry) }
                Spacer(Modifier.height(12.dp))
                Text(
                    "You'll get a link to send them. They can still reach you, but only through me, and only in words I'm willing to carry. When I judge it's over, it's deleted.",
                    style = MaterialTheme.typography.bodyMedium, color = Ink.Fog, textAlign = TextAlign.Center,
                )
            } else {
                Field(code, { code = it.trim() }, "Invite link or code", capitalization = KeyboardCapitalization.Characters)
                Spacer(Modifier.height(28.dp))
                val parsed = inviteCodeFrom(code)
                Solemn("ENTER", enabled = name.isNotBlank() && parsed != null && !state.busy) { vm.join(parsed!!, name) }
                Spacer(Modifier.height(12.dp))
                Text(
                    "Someone asked for space. You can still talk to them, through me. Say anything; I'll pass on what matters.",
                    style = MaterialTheme.typography.bodyMedium, color = Ink.Fog, textAlign = TextAlign.Center,
                )
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
