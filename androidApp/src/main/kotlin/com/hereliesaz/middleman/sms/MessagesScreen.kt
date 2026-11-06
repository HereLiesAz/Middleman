package com.hereliesaz.middleman.sms

import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Telephony
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.heightIn
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import kotlinx.coroutines.launch
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.hereliesaz.middleman.ui.Field
import com.hereliesaz.middleman.ui.Ink
import com.hereliesaz.middleman.ui.MiddlemanAside
import com.hereliesaz.middleman.ui.Solemn
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** The ordinary messaging screens: conversations, one conversation, and a box to write in. */
@Composable
fun MessagesScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    var open by remember { mutableStateOf<Conversation?>(null) }
    var changes by remember { mutableIntStateOf(0) }
    DisposableEffect(Unit) {
        val observer = object : ContentObserver(Handler(Looper.getMainLooper())) { override fun onChange(selfChange: Boolean) { changes++ } }
        context.contentResolver.registerContentObserver(Telephony.Sms.CONTENT_URI, true, observer)
        onDispose { context.contentResolver.unregisterContentObserver(observer) }
    }
    BackHandler { if (open != null) open = null else onBack() }

    val current = open
    if (current == null) {
        val conversations by produceState(emptyList<Conversation>(), changes) { value = withContext(Dispatchers.IO) { SmsStore.conversations(context) } }
        Column(Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 16.dp)) {
            TextButton(onClick = onBack) { Text("Back", color = Ink.Bone) }
            if (conversations.isEmpty()) Text("No messages.", style = MiddlemanAside, modifier = Modifier.padding(32.dp).fillMaxWidth(), textAlign = TextAlign.Center)
            LazyColumn {
                items(conversations, key = { it.id }) { c ->
                    Column(Modifier.fillMaxWidth().clickable { open = c }.padding(vertical = 12.dp)) {
                        Text(Contacts.label(context, c.address), style = MaterialTheme.typography.titleMedium, maxLines = 1)
                        Text(c.last, style = MaterialTheme.typography.bodyMedium, color = Ink.Fog, maxLines = 2)
                    }
                    HorizontalDivider(color = Ink.Smoke)
                }
            }
        }
    } else {
        val texts by produceState(emptyList<Text>(), changes, current.id) { value = withContext(Dispatchers.IO) { SmsStore.thread(context, current.id) } }
        var draft by remember { mutableStateOf("") }
        var picture by remember { mutableStateOf<Uri?>(null) }
        val pick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { if (it != null) picture = it }
        val scope = rememberCoroutineScope()
        val list = rememberLazyListState()
        LaunchedEffect(texts.size) { if (texts.isNotEmpty()) list.scrollToItem(texts.lastIndex) }
        Column(Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 16.dp)) {
            TextButton(onClick = { open = null }) { Text("‹ ${Contacts.label(context, current.address)}", color = Ink.Bone) }
            LazyColumn(Modifier.weight(1f), state = list, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(texts, key = { it.id }) { t ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (t.mine) Arrangement.End else Arrangement.Start) {
                        Column(Modifier.fillMaxWidth(0.8f), horizontalAlignment = if (t.mine) Alignment.End else Alignment.Start) {
                        t.image?.let { part ->
                            val bitmap by produceState<androidx.compose.ui.graphics.ImageBitmap?>(null, part) {
                                value = withContext(Dispatchers.IO) { MmsStore.image(context, part)?.asImageBitmap() }
                            }
                            bitmap?.let { Image(it, null, Modifier.heightIn(max = 280.dp), contentScale = ContentScale.Fit) }
                        }
                        if (t.body.isNotEmpty() || t.failed) Text(t.body + if (t.failed) "  ✗ not sent" else if (t.delivered) "  ✓" else "", color = if (t.mine) Ink.Light else Ink.Bone, textAlign = if (t.mine) TextAlign.End else TextAlign.Start)
                        }
                    }
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                TextButton(onClick = { if (picture != null) picture = null else pick.launch("image/*") }) {
                    Text(if (picture != null) "✕ Picture" else "Picture", color = Ink.Bone)
                }
                Field(draft, { draft = it }, "Message", modifier = Modifier.weight(1f), singleLine = false)
                Solemn("SEND", modifier = Modifier, enabled = draft.isNotBlank() || picture != null) {
                    val words = draft.trim()
                    val attached = picture
                    draft = ""; picture = null
                    scope.launch(Dispatchers.IO) {
                        runCatching {
                            if (attached != null) MmsSender.send(context, current.address, words, attached) else SmsStore.send(context, current.address, words)
                        }.onFailure { withContext(Dispatchers.Main) { Toast.makeText(context, it.message ?: "Couldn't send that.", Toast.LENGTH_LONG).show() } }
                    }
                }
            }
        }
    }
}
