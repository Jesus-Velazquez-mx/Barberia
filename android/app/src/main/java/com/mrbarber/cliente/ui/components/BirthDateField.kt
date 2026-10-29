package com.mrbarber.cliente.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale

/** Campo de solo lectura que abre un calendario (sin fechas futuras) al tocarlo. */
@Composable
fun BirthDateField(
    value: LocalDate?,
    onValueChange: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Fecha de nacimiento",
    enabled: Boolean = true
) {
    var showDatePicker by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        OutlinedTextField(
            value = value?.format(DATE_FORMAT).orEmpty(),
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            enabled = enabled,
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth()
        )
        Box(
            modifier = Modifier
                .matchParentSize()
                .clickable(enabled = enabled) { showDatePicker = true }
        )
    }

    if (showDatePicker) {
        BirthDatePickerDialog(
            initialDate = value,
            onDismiss = { showDatePicker = false },
            onConfirm = {
                showDatePicker = false
                onValueChange(it)
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BirthDatePickerDialog(
    initialDate: LocalDate?,
    onDismiss: () -> Unit,
    onConfirm: (LocalDate) -> Unit
) {
    // El DatePicker trabaja con milisegundos en UTC.
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = initialDate?.atStartOfDay(ZoneOffset.UTC)?.toInstant()?.toEpochMilli(),
        selectableDates = object : SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long): Boolean =
                utcTimeMillis <= System.currentTimeMillis()

            override fun isSelectableYear(year: Int): Boolean =
                year <= LocalDate.now().year
        }
    )

    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        onConfirm(Instant.ofEpochMilli(millis).atOffset(ZoneOffset.UTC).toLocalDate())
                    }
                },
                enabled = datePickerState.selectedDateMillis != null
            ) {
                Text("Aceptar", color = Dorado)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = GrisClaro)
            }
        }
    ) {
        DatePicker(state = datePickerState)
    }
}

private val DATE_FORMAT: DateTimeFormatter =
    DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es-MX"))
