package com.hereliesaz.middleman.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/** Monochrome. One light in a dark room. Middleman speaks in serif; people speak in sans. */
object Ink {
    val Void = Color(0xFF050505)
    val Night = Color(0xFF0E0E0E)
    val Ash = Color(0xFF1A1A1A)
    val Smoke = Color(0xFF2A2A2A)
    val Fog = Color(0xFF6B6B6B)
    val Bone = Color(0xFFBDBDBD)
    val Light = Color(0xFFF2F0EB)
}

private val scheme = darkColorScheme(
    primary = Ink.Light,
    onPrimary = Ink.Void,
    secondary = Ink.Bone,
    onSecondary = Ink.Void,
    background = Ink.Void,
    onBackground = Ink.Light,
    surface = Ink.Night,
    onSurface = Ink.Light,
    surfaceVariant = Ink.Ash,
    onSurfaceVariant = Ink.Bone,
    outline = Ink.Smoke,
    outlineVariant = Ink.Ash,
    error = Ink.Light,
    onError = Ink.Void,
)

val MiddlemanVoice = TextStyle(fontFamily = FontFamily.Serif, fontSize = 17.sp, lineHeight = 26.sp, color = Ink.Light)
val MiddlemanAside = MiddlemanVoice.copy(fontStyle = FontStyle.Italic, fontSize = 15.sp, color = Ink.Bone)

private val type = Typography(
    displayLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Light, fontSize = 40.sp, letterSpacing = 8.sp),
    headlineSmall = TextStyle(fontFamily = FontFamily.Serif, fontSize = 22.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.Medium, fontSize = 15.sp, letterSpacing = 1.sp),
    bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 20.sp),
    labelSmall = TextStyle(fontSize = 11.sp, letterSpacing = 2.sp, fontWeight = FontWeight.Medium),
)

@Composable
fun MiddlemanTheme(content: @Composable () -> Unit) = MaterialTheme(colorScheme = scheme, typography = type, content = content)
