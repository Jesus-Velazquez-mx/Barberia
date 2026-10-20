package com.mrbarber.cliente.ui.components

import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.sp
import com.mrbarber.cliente.ui.theme.Dorado

@Composable
fun BackButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    TextButton(onClick = onClick, enabled = enabled, modifier = modifier) {
        Text("‹ Volver", color = Dorado, fontSize = 16.sp)
    }
}
