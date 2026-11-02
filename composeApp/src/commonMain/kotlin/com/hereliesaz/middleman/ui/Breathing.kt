package com.hereliesaz.middleman.ui

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.hereliesaz.middleman.model.Timeout
import kotlinx.coroutines.delay
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

/** Box breathing, 4·4·4·4, over everything, until the timeout ends. */
@OptIn(ExperimentalTime::class)
@Composable
fun Breathing(t: Timeout, calledBy: String) {
    var now by remember { mutableLongStateOf(Clock.System.now().toEpochMilliseconds()) }
    LaunchedEffect(t) { while (now < t.endsAt) { delay(250); now = Clock.System.now().toEpochMilliseconds() } }
    if (now >= t.endsAt) return

    val cycle = rememberInfiniteTransition()
    val scale by cycle.animateFloat(
        initialValue = 0.55f, targetValue = 0.55f,
        animationSpec = infiniteRepeatable(keyframes {
            durationMillis = 16_000
            0.55f at 0; 1f at 4_000 using FastOutSlowInEasing; 1f at 8_000; 0.55f at 12_000 using FastOutSlowInEasing; 0.55f at 16_000
        }),
    )
    val phase = listOf("Breathe in", "Hold", "Breathe out", "Hold")[((now / 4_000) % 4).toInt()]

    Box(Modifier.fillMaxSize().background(Ink.Void.copy(alpha = 0.96f)), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(32.dp)) {
            Text("$calledBy called a timeout.", style = MiddlemanAside, textAlign = TextAlign.Center)
            Box(Modifier.size(200.dp).scale(scale).border(1.dp, Ink.Light, CircleShape))
            Text(phase, style = MaterialTheme.typography.headlineSmall)
            Text("${(t.endsAt - now) / 1000 + 1}", style = MaterialTheme.typography.labelSmall, color = Ink.Fog)
        }
    }
}
