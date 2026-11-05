package com.mrbarber.cliente.features.appointment.presentation

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontWeight
import com.mrbarber.cliente.ui.theme.Dorado

/** Avisa que la cita que se quiso reagendar o cancelar ya no existe. */
@Composable
fun AppointmentUnavailableDialog(message: String, onAccept: () -> Unit) {
    AlertDialog(
        onDismissRequest = onAccept,
        title = { Text("Cita no encontrada") },
        text = { Text(message) },
        confirmButton = {
            TextButton(onClick = onAccept) {
                Text("ACEPTAR", color = Dorado, fontWeight = FontWeight.Bold)
            }
        }
    )
}
