package com.hereliesaz.middleman.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp
import com.hereliesaz.middleman.model.Insight
import com.hereliesaz.middleman.model.Message
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.rules.joinedNaturally

/** Middleman: full-width serif, ruled on the left. People: sans, right-aligned if it's you. */
@Composable
fun MessageItem(m: Message, s: SessionView, onBridge: (String) -> Unit) {
    val name = { id: String? -> s.participants.firstOrNull { it.id == id }?.name ?: "Someone" }
    if (m.authorId == null) {
        Row {
            Box(Modifier.width(1.dp).height(24.dp).background(Ink.Fog))
            Column(Modifier.padding(start = 16.dp)) {
                val label = when {
                    m.onBehalfOf != null -> "MIDDLEMAN, FOR ${name(m.onBehalfOf).uppercase()}"
                    m.visibleTo != null -> "MIDDLEMAN · ONLY YOU SEE THIS"
                    else -> "MIDDLEMAN"
                }
                Text(label, style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
                Text(m.text, style = MiddlemanVoice, modifier = Modifier.padding(top = 6.dp))
                m.insight?.let { InsightPanel(it, m, s, onBridge) }
            }
        }
    } else {
        val mine = m.authorId == s.you.id
        Column(Modifier.fillMaxWidth(), horizontalAlignment = if (mine) Alignment.End else Alignment.Start) {
            Text(if (mine) "YOU" else name(m.authorId).uppercase(), style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
            Text(
                m.text,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.padding(top = 6.dp).widthIn(max = 520.dp)
                    .border(1.dp, if (mine) Ink.Smoke else Ink.Ash).padding(14.dp)
                    .alpha(if (m.held) 0.45f else 1f),
            )
            if (m.held) Text("Held. Nobody else saw this.", style = MiddlemanAside, modifier = Modifier.padding(top = 4.dp))
            m.alerts.filterNot { it.holds }.forEach {
                Text(it.note, style = MaterialTheme.typography.bodyMedium, color = Ink.Fog, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}

/** What Middleman saw in what you said. Folded by default; it's for you, not a lecture. */
@Composable
private fun InsightPanel(i: Insight, m: Message, s: SessionView, onBridge: (String) -> Unit) {
    var open by rememberSaveable(m.id) { mutableStateOf(false) }
    Text(
        if (open) "Fold" else "What I heard underneath",
        style = MaterialTheme.typography.labelSmall,
        color = Ink.Bone,
        modifier = Modifier.clickable { open = !open }.padding(vertical = 10.dp),
    )
    AnimatedVisibility(open) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Line("THE NEED", i.underlyingNeed)
            Line("WHAT IT'S ABOUT", i.layers.content)
            Line("WHAT IT'S ACTUALLY ABOUT", i.layers.feelings)
            Line("WHERE YOU DIFFER", i.areaOfContrast)
            Line("WHERE YOU MEET", i.commonGround)
            Line("A WAY TO SAY IT", "${i.sandwich.anchorOfCare} ${i.sandwich.vulnerableTruth} ${i.sandwich.reassurance}")
        }
    }
    val others = s.participants.filter { it.id != s.you.id }
    if (i.bridge != null && others.isNotEmpty()) {
        if (m.bridged) {
            Text("Delivered to ${others.map { it.name }.joinedNaturally()}.", style = MiddlemanAside)
        } else {
            Column(Modifier.padding(top = 4.dp).border(1.dp, Ink.Smoke).padding(14.dp)) {
                Text("I could tell ${others.map { it.name }.joinedNaturally()} this, for you:", style = MaterialTheme.typography.bodyMedium, color = Ink.Fog)
                Text("“${i.bridge}”", style = MiddlemanAside, modifier = Modifier.padding(vertical = 8.dp))
                TextButton(onClick = { onBridge(m.id) }) { Text("SEND IT, IN MY NAME", style = MaterialTheme.typography.labelSmall, color = Ink.Light) }
            }
        }
    }
}

@Composable
private fun Line(label: String, text: String) = Column {
    Text(label, style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
    Text(text, style = MaterialTheme.typography.bodyMedium, color = Ink.Bone, modifier = Modifier.padding(top = 2.dp))
}
