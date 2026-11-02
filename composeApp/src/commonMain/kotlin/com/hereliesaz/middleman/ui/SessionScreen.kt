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
import androidx.compose.runtime.remember
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
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.rules.joinedNaturally
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

/** One room: you and Middleman. Everyone else exists only as what Middleman tells you. */
@Composable
fun SessionScreen(s: SessionView, state: UiState, vm: MiddlemanViewModel) = Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
    Column(Modifier.widthIn(max = 720.dp).fillMaxSize()) {
        Header(s, state, vm)
        HorizontalDivider(color = Ink.Ash)
        Room(s, Modifier.weight(1f))
        Composer(if (s.participants.size < 2) "Say it here first" else "Say anything. I'll decide what they hear.", state.busy, vm::say)
    }
}

@OptIn(ExperimentalTime::class)
@Composable
private fun Header(s: SessionView, state: UiState, vm: MiddlemanViewModel) {
    @Suppress("DEPRECATION") // LocalClipboard needs platform ClipEntry constructors; not worth an expect/actual for one string.
    val clipboard = LocalClipboardManager.current
    var copied by remember { mutableStateOf(false) }
    val others = s.participants.filter { it.id != s.you.id }
    Column(Modifier.padding(start = 20.dp, end = 8.dp, top = 12.dp, bottom = 12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(s.title, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
            TextButton(onClick = vm::leave) { Text("Leave", color = Ink.Fog) }
        }
        Text(
            when {
                others.isEmpty() -> "Nobody else is here yet."
                s.you.id == s.starterId -> "${others.map { it.name }.joinedNaturally()} can reach you only through Middleman."
                else -> "${s.participants.first { it.id == s.starterId }.name} asked for space. You reach them through Middleman."
            },
            style = MaterialTheme.typography.bodyMedium, color = Ink.Bone,
        )
        Row(verticalAlignment = Alignment.CenterVertically) {
            s.expiresAt?.let {
                val days = ((it - Clock.System.now().toEpochMilliseconds()) / 86_400_000L).coerceAtLeast(0)
                Text(if (days == 0L) "Deleted within a day" else "Deleted in $days days at most", style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
            }
            Spacer(Modifier.weight(1f))
            Text(
                if (copied) "LINK COPIED" else "COPY INVITE LINK",
                style = MaterialTheme.typography.labelSmall,
                color = Ink.Light,
                modifier = Modifier.clickable { clipboard.setText(AnnotatedString(s.link)); copied = true }.padding(12.dp),
            )
        }
        if (!state.connected) Text("Reconnecting…", style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
    }
}

@Composable
private fun Room(s: SessionView, modifier: Modifier) {
    val list = rememberLazyListState()
    LaunchedEffect(s.room.size) { if (s.room.isNotEmpty()) list.animateScrollToItem(s.room.lastIndex) }
    if (s.room.isEmpty()) {
        val empty = when {
            s.participants.size < 2 -> "Send them the link.\n\nMeanwhile, this room is yours. Nobody else will read it. What happened?"
            s.you.id == s.starterId -> "This room is yours. Nobody else will read it. What happened?"
            else -> "This room is yours. Nobody else will read it. Say what you need to say, and I'll carry what matters to them."
        }
        Box(modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) { Text(empty, style = MiddlemanAside) }
        return
    }
    LazyColumn(modifier.fillMaxWidth(), state = list, contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        items(s.room, key = { it.id }) { MessageItem(it, s) }
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
