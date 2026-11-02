package com.hereliesaz.middleman.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import com.hereliesaz.middleman.MiddlemanViewModel
import com.hereliesaz.middleman.UiState
import com.hereliesaz.middleman.model.Message
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.rules.joinedNaturally

private enum class RoomTab { ALONE, TOGETHER }

/** Two rooms: alone with Middleman, and — once it's safe — together. */
@Composable
fun SessionScreen(s: SessionView, state: UiState, vm: MiddlemanViewModel) {
    var tab by rememberSaveable { mutableStateOf(RoomTab.ALONE) }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        Column(Modifier.widthIn(max = 720.dp).fillMaxSize()) {
            Header(s, state, vm)
            Row(Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(28.dp)) {
                Tab("ALONE WITH MIDDLEMAN", tab == RoomTab.ALONE) { tab = RoomTab.ALONE }
                Tab(if (s.jointUnlocked) "TOGETHER" else "TOGETHER · LOCKED", tab == RoomTab.TOGETHER) { tab = RoomTab.TOGETHER }
            }
            HorizontalDivider(color = Ink.Ash)
            Box(Modifier.weight(1f)) {
                when (tab) {
                    RoomTab.ALONE -> PrivateRoom(s, state, vm)
                    RoomTab.TOGETHER -> JointRoom(s, state, vm)
                }
            }
        }
        s.timeout?.let { Breathing(it, s.participants.first { p -> p.id == it.calledBy }.name) }
    }
}

@Composable
private fun Header(s: SessionView, state: UiState, vm: MiddlemanViewModel) {
    @Suppress("DEPRECATION") // LocalClipboard needs platform ClipEntry constructors; not worth an expect/actual for one string.
    val clipboard = LocalClipboardManager.current
    Column(Modifier.padding(start = 20.dp, end = 8.dp, top = 12.dp, bottom = 12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(s.title, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
            TextButton(onClick = vm::leave) { Text("Leave", color = Ink.Fog) }
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                s.participants.map { if (it.id == s.you.id) "${it.name} (you)" else it.name }.joinedNaturally(),
                style = MaterialTheme.typography.bodyMedium, color = Ink.Bone, modifier = Modifier.weight(1f),
            )
            Text(
                "CODE ${s.inviteCode}",
                style = MaterialTheme.typography.labelSmall,
                color = Ink.Light,
                modifier = Modifier.clickable { clipboard.setText(AnnotatedString(s.inviteCode)) }.padding(12.dp),
            )
        }
        if (!state.connected) Text("Reconnecting…", style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
    }
}

@Composable
private fun PrivateRoom(s: SessionView, state: UiState, vm: MiddlemanViewModel) = Column(Modifier.fillMaxSize()) {
    Transcript(
        s.privateRoom, s, Modifier.weight(1f),
        empty = if (s.participants.size < 2) "Nobody else is here yet. Give them the code ${s.inviteCode}.\n\nMeanwhile: what happened?"
        else "This room is yours. Nobody else will ever read it.\n\nWhat happened?",
        onBridge = vm::bridge,
    )
    Composer("Say it here first", state.busy, vm::sayPrivately)
}

@Composable
private fun JointRoom(s: SessionView, state: UiState, vm: MiddlemanViewModel) = Column(Modifier.fillMaxSize()) {
    ReadinessLine(s.readiness, Modifier.padding(20.dp))
    if (!s.jointUnlocked) {
        Text(
            "This room opens when everyone has been heard privately and their needs are named. Not before. It isn't a punishment; it's a seatbelt.",
            style = MiddlemanAside, modifier = Modifier.padding(horizontal = 20.dp),
        )
        return@Column
    }
    Transcript(s.jointRoom, s, Modifier.weight(1f), empty = "Everyone has been heard. Start gently.", onBridge = {})
    Row(Modifier.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        TextButton(onClick = vm::timeout, enabled = s.timeout == null) { Text("Timeout", color = Ink.Bone) }
        Spacer(Modifier.weight(1f))
        Text("Everyone sees this room", style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
    }
    Composer("Say it to everyone", state.busy || s.timeout != null, vm::sayToEveryone)
}

@Composable
private fun Transcript(messages: List<Message>, s: SessionView, modifier: Modifier, empty: String, onBridge: (String) -> Unit) {
    val list = rememberLazyListState()
    LaunchedEffect(messages.size) { if (messages.isNotEmpty()) list.animateScrollToItem(messages.lastIndex) }
    if (messages.isEmpty()) {
        Box(modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) { Text(empty, style = MiddlemanAside) }
        return
    }
    LazyColumn(modifier.fillMaxWidth(), state = list, contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        items(messages, key = { it.id }) { MessageItem(it, s, onBridge) }
    }
}

@Composable
private fun Composer(hint: String, busy: Boolean, send: (String) -> Unit) {
    var draft by rememberSaveable { mutableStateOf("") }
    Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.Bottom) {
        Field(draft, { draft = it }, hint, Modifier.weight(1f), KeyboardCapitalization.Sentences, singleLine = false)
        Spacer(Modifier.width(8.dp))
        Solemn(if (busy) "…" else "SEND", Modifier.width(88.dp), enabled = draft.isNotBlank() && !busy) {
            send(draft.trim()); draft = ""
        }
    }
    Spacer(Modifier.height(4.dp))
}
