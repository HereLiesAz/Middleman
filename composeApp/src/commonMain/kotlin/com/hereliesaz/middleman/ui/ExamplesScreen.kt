package com.hereliesaz.middleman.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.hereliesaz.middleman.model.Walkthrough
import com.hereliesaz.middleman.model.Walkthroughs

/** Three fights, taken apart. Read-only; nobody here is real, which is the only reason it's easy. */
@Composable
fun ExamplesScreen(onBack: () -> Unit) = Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
    LazyColumn(Modifier.widthIn(max = 720.dp), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(32.dp)) {
        item {
            TextButton(onClick = onBack) { Text("← Back", color = Ink.Bone) }
            Text("How it works", style = MaterialTheme.typography.headlineSmall, modifier = Modifier.padding(top = 8.dp))
            Text(
                "Everyone talks to Middleman alone. Middleman listens for the need under the words, finds where you differ and where you meet, and only opens the shared room when it's safe. Here is what that looks like.",
                style = MiddlemanAside, modifier = Modifier.padding(top = 12.dp),
            )
        }
        items(Walkthroughs) { Example(it) }
    }
}

@Composable
private fun Example(w: Walkthrough) = Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
    HorizontalDivider(color = Ink.Ash)
    Text(w.title.uppercase(), style = MaterialTheme.typography.labelSmall, color = Ink.Light)
    Text(w.context, style = MaterialTheme.typography.bodyMedium, color = Ink.Fog)
    Said(w.people.first, w.raw.first)
    Said(w.people.second, w.raw.second)
    Said("Middleman hears", w.heard, voice = true)
    Said("Notices", w.misread, voice = true)
    Said("Where they differ", w.contrast, voice = true)
    Said("Where they meet", w.commonGround, voice = true)
    Said("Asks", w.question, voice = true)
    Said("Carries across", w.bridge, voice = true)
}

@Composable
private fun Said(who: String, text: String, voice: Boolean = false) = Column {
    Text(who.uppercase(), style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
    Text(text, style = if (voice) MiddlemanVoice else MaterialTheme.typography.bodyLarge, modifier = Modifier.padding(top = 2.dp))
}
