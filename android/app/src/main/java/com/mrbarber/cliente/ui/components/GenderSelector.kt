package com.mrbarber.cliente.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mrbarber.cliente.features.profile.domain.model.Gender
import com.mrbarber.cliente.ui.theme.GrisClaro

/** Título y chips para elegir el género. */
@Composable
fun GenderSelector(
    selected: Gender?,
    onSelect: (Gender) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Género",
    enabled: Boolean = true
) {
    Column(modifier = modifier) {
        Text(label, fontSize = 14.sp, color = GrisClaro)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Gender.entries.forEach { gender ->
                FilterChip(
                    selected = selected == gender,
                    onClick = { onSelect(gender) },
                    label = { Text(gender.label()) },
                    enabled = enabled
                )
            }
        }
    }
}

private fun Gender.label(): String = when (this) {
    Gender.MALE -> "Masculino"
    Gender.FEMALE -> "Femenino"
    Gender.OTHER -> "Otro"
}
