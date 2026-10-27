package com.mrbarber.cliente.features.perfil.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mrbarber.cliente.features.perfil.domain.model.Gender
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro
import com.mrbarber.cliente.ui.theme.GrisOscuro
import com.mrbarber.cliente.ui.theme.MrBarberTheme
import com.mrbarber.cliente.ui.theme.Negro
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun ProfileRoute(
    onBack: () -> Unit,
    onLoggedOut: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(state.isLoggedOut) {
        if (state.isLoggedOut) onLoggedOut()
    }

    Profile(
        state = state,
        onBack = onBack,
        onFirstNameChange = viewModel::onFirstNameChange,
        onLastNameChange = viewModel::onLastNameChange,
        onEmailChange = viewModel::onEmailChange,
        onPhoneChange = viewModel::onPhoneChange,
        onBirthDateChange = viewModel::onBirthDateChange,
        onGenderChange = viewModel::onGenderChange,
        onSaveClick = viewModel::onSaveClick,
        onLogoutConfirm = viewModel::onLogoutConfirm,
        onDeleteAccountConfirm = viewModel::onDeleteAccountConfirm,
        modifier = modifier
    )
}

@Composable
fun Profile(
    state: ProfileUiState,
    onBack: () -> Unit,
    onFirstNameChange: (String) -> Unit,
    onLastNameChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onPhoneChange: (String) -> Unit,
    onBirthDateChange: (LocalDate) -> Unit,
    onGenderChange: (Gender) -> Unit,
    onSaveClick: () -> Unit,
    onLogoutConfirm: () -> Unit,
    onDeleteAccountConfirm: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showDatePicker by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        if (state.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Dorado)
            }
            return@Surface
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 8.dp)
        ) {
            TextButton(onClick = onBack, enabled = !state.isBusy) {
                Text("‹ Volver", color = Dorado, fontSize = 16.sp)
            }

            Spacer(Modifier.height(8.dp))

            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("MI PERFIL", fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(16.dp))
                Avatar(name = state.displayName)
                Spacer(Modifier.height(12.dp))
                Text(
                    text = state.displayName,
                    fontSize = 20.sp,
                    color = Dorado,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Text(text = state.displayEmail, fontSize = 14.sp, color = GrisClaro)
            }

            Spacer(Modifier.height(24.dp))

            SectionCard(title = "Información personal") {
                ProfileTextField(
                    value = state.firstName,
                    onValueChange = onFirstNameChange,
                    label = "Nombre",
                    enabled = !state.isBusy
                )
                ProfileTextField(
                    value = state.lastName,
                    onValueChange = onLastNameChange,
                    label = "Apellido",
                    enabled = !state.isBusy
                )
                ProfileTextField(
                    value = state.email,
                    onValueChange = onEmailChange,
                    label = "Correo electrónico",
                    keyboardType = KeyboardType.Email,
                    enabled = !state.isBusy
                )
                ProfileTextField(
                    value = state.phone,
                    onValueChange = onPhoneChange,
                    label = "Teléfono (10 dígitos)",
                    keyboardType = KeyboardType.Phone,
                    enabled = !state.isBusy
                )

                // Campo de solo lectura que abre el calendario al tocarlo.
                Box {
                    OutlinedTextField(
                        value = state.birthDate?.format(DATE_FORMAT).orEmpty(),
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Fecha de nacimiento") },
                        enabled = !state.isBusy,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable(enabled = !state.isBusy) { showDatePicker = true }
                    )
                }

                Text("Género", fontSize = 14.sp, color = GrisClaro)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Gender.entries.forEach { gender ->
                        FilterChip(
                            selected = state.gender == gender,
                            onClick = { onGenderChange(gender) },
                            label = { Text(gender.label()) },
                            enabled = !state.isBusy
                        )
                    }
                }

                state.error?.let {
                    Text(text = it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                }
                state.successMessage?.let {
                    Text(text = it, color = Dorado, fontSize = 13.sp)
                }

                Button(
                    onClick = onSaveClick,
                    enabled = state.canSave,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (state.isSaving) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Text("GUARDAR CAMBIOS", fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            SectionCard(title = "Cuenta") {
                OutlinedButton(
                    onClick = { showLogoutDialog = true },
                    enabled = !state.isBusy,
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = GrisClaro),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("CERRAR SESIÓN", fontWeight = FontWeight.Bold)
                }
                TextButton(
                    onClick = { showDeleteDialog = true },
                    enabled = !state.isBusy,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (state.isDeleting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.error
                        )
                    } else {
                        Text(
                            "ELIMINAR CUENTA",
                            color = MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }

    if (showDatePicker) {
        BirthDatePickerDialog(
            initialDate = state.birthDate,
            onDismiss = { showDatePicker = false },
            onConfirm = {
                showDatePicker = false
                onBirthDateChange(it)
            }
        )
    }

    if (showLogoutDialog) {
        ConfirmDialog(
            title = "Cerrar sesión",
            text = "¿Seguro que quieres cerrar tu sesión?",
            confirmText = "Cerrar sesión",
            onDismiss = { showLogoutDialog = false },
            onConfirm = {
                showLogoutDialog = false
                onLogoutConfirm()
            }
        )
    }

    if (showDeleteDialog) {
        ConfirmDialog(
            title = "Eliminar cuenta",
            text = "Esta acción es permanente: se borrarán tu cuenta y todo tu historial, y no se puede deshacer. ¿Quieres continuar?",
            confirmText = "Eliminar",
            isDestructive = true,
            onDismiss = { showDeleteDialog = false },
            onConfirm = {
                showDeleteDialog = false
                onDeleteAccountConfirm()
            }
        )
    }
}

@Composable
private fun Avatar(name: String) {
    val initials = name.split(" ")
        .filter { it.isNotBlank() }
        .take(2)
        .joinToString("") { it.first().uppercase() }

    Box(
        modifier = Modifier
            .size(88.dp)
            .clip(CircleShape)
            .background(Dorado),
        contentAlignment = Alignment.Center
    ) {
        Text(initials, color = Negro, fontSize = 32.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun SectionCard(title: String, content: @Composable () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = GrisOscuro),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Dorado)
            content()
        }
    }
}

@Composable
private fun ProfileTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    enabled: Boolean,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        enabled = enabled,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.fillMaxWidth()
    )
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

@Composable
private fun ConfirmDialog(
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

private fun Gender.label(): String = when (this) {
    Gender.MALE -> "Masculino"
    Gender.FEMALE -> "Femenino"
    Gender.OTHER -> "Otro"
}

private val DATE_FORMAT: DateTimeFormatter =
    DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es-MX"))

@Preview(showBackground = true)
@Composable
fun ProfilePreview() {
    MrBarberTheme {
        Profile(
            state = ProfileUiState(
                isLoading = false,
                displayName = "Asuka Langley Soryu",
                displayEmail = "asuka.soryu@nerv-barbershop.test",
                firstName = "Asuka",
                lastName = "Langley Soryu",
                email = "asuka.soryu@nerv-barbershop.test",
                phone = "5550000010",
                birthDate = LocalDate.of(2004, 10, 1),
                gender = Gender.FEMALE
            ),
            onBack = {},
            onFirstNameChange = {},
            onLastNameChange = {},
            onEmailChange = {},
            onPhoneChange = {},
            onBirthDateChange = {},
            onGenderChange = {},
            onSaveClick = {},
            onLogoutConfirm = {},
            onDeleteAccountConfirm = {}
        )
    }
}
