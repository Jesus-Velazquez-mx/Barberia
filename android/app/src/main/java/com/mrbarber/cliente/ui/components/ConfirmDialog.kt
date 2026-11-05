package com.mrbarber.cliente.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro

/** Diálogo de confirmación con botones Cancelar / [confirmText]; [content] va debajo de [text]. */
@Composable
fun ConfirmDialog(
    title: String,
    text: String,
    confirmText: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
    isDestructive: Boolean = false,
    content: (@Composable () -> Unit)? = null
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column {
                Text(text)
                content?.let {
                    Spacer(Modifier.height(12.dp))
                    it()
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(
                    confirmText,
                    color = if (isDestructive) MaterialTheme.colorScheme.error else Dorado
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = GrisClaro)
            }
        }
    )
}
