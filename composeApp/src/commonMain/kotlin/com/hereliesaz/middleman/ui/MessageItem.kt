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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.hereliesaz.middleman.model.Insight
import com.hereliesaz.middleman.model.Message
import com.hereliesaz.middleman.model.SessionView
import com.hereliesaz.middleman.rules.joinedNaturally

/**
 * Middleman: full-width serif, ruled on the left; brighter when it carries someone else's words.
 * You: sans, right-aligned, with what was actually passed on (or not) beneath it.
 */
@Composable
fun MessageItem(m: Message, s: SessionView) {
    val name = { id: String? -> s.participants.firstOrNull { it.id == id }?.name ?: "Someone" }
    val others = s.participants.filter { it.id != s.you.id }.map { it.name }.joinedNaturally().ifEmpty { "them" }
    if (m.authorId == null) {
        val relay = m.relayFrom != null
        Row {
            Box(Modifier.width(if (relay) 2.dp else 1.dp).height(24.dp).background(if (relay) Ink.Light else Ink.Fog))
            Column(Modifier.padding(start = 16.dp)) {
                Text(
                    if (relay) "FROM ${name(m.relayFrom).uppercase()}, THROUGH MIDDLEMAN" else "MIDDLEMAN",
                    style = MaterialTheme.typography.labelSmall, color = if (relay) Ink.Bone else Ink.Fog,
                )
                Text(m.text, style = MiddlemanVoice, modifier = Modifier.padding(top = 6.dp))
                m.insight?.let { InsightPanel(it, m.id) }
            }
        }
    } else {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.End) {
            Text("YOU", style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
            Text(
                m.text,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.padding(top = 6.dp).widthIn(max = 520.dp).border(1.dp, Ink.Smoke).padding(14.dp),
            )
            m.deliveredAs?.let {
                Column(Modifier.padding(top = 6.dp).widthIn(max = 520.dp)) {
                    Text("WHAT $others HEARD".uppercase(), style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
                    Text(it, style = MiddlemanAside, modifier = Modifier.padding(top = 2.dp))
                }
            }
            // Middleman's reply explains why; here, just the fact.
            if (m.withheld != null) Text("NOT PASSED ON", style = MaterialTheme.typography.labelSmall, color = Ink.Fog, modifier = Modifier.padding(top = 6.dp))
        }
    }
}

/** What Middleman saw in what you said. Folded by default; it's for you, not a lecture. */
@Composable
private fun InsightPanel(i: Insight, key: String) {
    var open by rememberSaveable(key) { mutableStateOf(false) }
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
}

@Composable
private fun Line(label: String, text: String) = Column {
    Text(label, style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
    Text(text, style = MaterialTheme.typography.bodyMedium, color = Ink.Bone, modifier = Modifier.padding(top = 2.dp))
}
