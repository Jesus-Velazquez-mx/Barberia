package com.mrbarber.cliente.ui.components

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro

/** Diálogo de confirmación con botones Cancelar / [confirmText]. */
@Composable
fun ConfirmDialog(
    title: String,
    text: String,
    confirmText: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
    isDestructive: Boolean = false
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(text) },
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
