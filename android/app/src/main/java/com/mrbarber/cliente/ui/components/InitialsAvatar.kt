package com.mrbarber.cliente.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.Negro

/** Círculo con las iniciales (máximo dos) del nombre recibido. */
@Composable
fun InitialsAvatar(
    name: String,
    modifier: Modifier = Modifier,
    size: Dp = 88.dp,
    fontSize: TextUnit = 32.sp,
    containerColor: Color = Dorado,
    contentColor: Color = Negro,
    borderColor: Color? = null
) {
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(containerColor)
            .then(if (borderColor != null) Modifier.border(2.dp, borderColor, CircleShape) else Modifier),
        contentAlignment = Alignment.Center
    ) {
        Text(name.initials(), color = contentColor, fontSize = fontSize, fontWeight = FontWeight.Bold)
    }
}

private fun String.initials(): String = split(" ")
    .filter { it.isNotBlank() }
    .take(2)
    .joinToString("") { it.first().uppercase() }
