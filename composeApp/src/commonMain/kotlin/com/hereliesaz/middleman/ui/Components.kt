package com.hereliesaz.middleman.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.width
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp

@Composable
fun Field(
    value: String,
    onChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier.fillMaxWidth(),
    capitalization: KeyboardCapitalization = KeyboardCapitalization.None,
    keyboard: KeyboardOptions = KeyboardOptions(capitalization = capitalization),
    singleLine: Boolean = true,
) = OutlinedTextField(
    value = value,
    onValueChange = onChange,
    label = { Text(label) },
    singleLine = singleLine,
    maxLines = if (singleLine) 1 else 6,
    keyboardOptions = keyboard,
    shape = RectangleShape,
    modifier = modifier,
    colors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = Ink.Light,
        unfocusedBorderColor = Ink.Smoke,
        focusedLabelColor = Ink.Bone,
        unfocusedLabelColor = Ink.Fog,
        cursorColor = Ink.Light,
    ),
)

/** The only button style: a bordered, quiet commitment. */
@Composable
fun Solemn(text: String, modifier: Modifier = Modifier.fillMaxWidth(), enabled: Boolean = true, onClick: () -> Unit) =
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        shape = RectangleShape,
        border = BorderStroke(1.dp, if (enabled) Ink.Light else Ink.Smoke),
        modifier = modifier.height(52.dp),
    ) { Text(text, style = MaterialTheme.typography.labelSmall, color = if (enabled) Ink.Light else Ink.Fog) }

@Composable
fun Tab(text: String, selected: Boolean, onClick: () -> Unit) = Column(Modifier.width(IntrinsicSize.Max).clickable(onClick = onClick).padding(vertical = 8.dp)) {
    Text(text, style = MaterialTheme.typography.labelSmall, color = if (selected) Ink.Light else Ink.Fog)
    Box(Modifier.padding(top = 6.dp).height(1.dp).fillMaxWidth().background(if (selected) Ink.Light else Ink.Void))
}

