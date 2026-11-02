package com.hereliesaz.middleman.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.hereliesaz.middleman.model.EndReason
import com.hereliesaz.middleman.model.Ending

/** The last screen of a mediation. The server has already forgotten it; this note is the only copy, and it's in memory. */
@Composable
fun EndedScreen(e: Ending, onDone: () -> Unit) = Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
    Column(Modifier.widthIn(max = 440.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(28.dp)) {
        Text(
            when (e.reason) {
                EndReason.RESOLVED -> "RESOLVED"
                EndReason.EXPIRED -> "EXPIRED"
                EndReason.REPLACED -> "REPLACED"
            },
            style = MaterialTheme.typography.labelSmall, color = Ink.Fog,
        )
        Text(e.note, style = MiddlemanVoice, textAlign = TextAlign.Center)
        Text("Nothing from it was kept.", style = MiddlemanAside, textAlign = TextAlign.Center)
        Solemn("DONE", onClick = onDone)
    }
}
