package com.mrbarber.cliente.features.profile.presentation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mrbarber.cliente.features.profile.domain.model.Gender
import com.mrbarber.cliente.ui.components.AppTextField
import com.mrbarber.cliente.ui.components.BackButton
import com.mrbarber.cliente.ui.components.BirthDateField
import com.mrbarber.cliente.ui.components.ConfirmDialog
import com.mrbarber.cliente.ui.components.FullScreenLoading
import com.mrbarber.cliente.ui.components.GenderSelector
import com.mrbarber.cliente.ui.components.InitialsAvatar
import com.mrbarber.cliente.ui.components.LoadingButton
import com.mrbarber.cliente.ui.components.SectionCard
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro
import com.mrbarber.cliente.ui.theme.MrBarberTheme
import java.time.LocalDate

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
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        if (state.isLoading) {
            FullScreenLoading()
            return@Surface
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 8.dp)
        ) {
            BackButton(onClick = onBack, enabled = !state.isBusy)

            Spacer(Modifier.height(8.dp))

            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("MI PERFIL", fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(16.dp))
                InitialsAvatar(name = state.displayName)
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
                AppTextField(
                    value = state.firstName,
                    onValueChange = onFirstNameChange,
                    label = "Nombre",
                    enabled = !state.isBusy
                )
                AppTextField(
                    value = state.lastName,
                    onValueChange = onLastNameChange,
                    label = "Apellido",
                    enabled = !state.isBusy
                )
                AppTextField(
                    value = state.email,
                    onValueChange = onEmailChange,
                    label = "Correo electrónico",
                    keyboardType = KeyboardType.Email,
                    enabled = !state.isBusy
                )
                AppTextField(
                    value = state.phone,
                    onValueChange = onPhoneChange,
                    label = "Teléfono (10 dígitos)",
                    keyboardType = KeyboardType.Phone,
                    enabled = !state.isBusy
                )

                BirthDateField(
                    value = state.birthDate,
                    onValueChange = onBirthDateChange,
                    enabled = !state.isBusy
                )

                GenderSelector(
                    selected = state.gender,
                    onSelect = onGenderChange,
                    enabled = !state.isBusy
                )

                state.error?.let {
                    Text(text = it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                }
                state.successMessage?.let {
                    Text(text = it, color = Dorado, fontSize = 13.sp)
                }

                LoadingButton(
                    text = "GUARDAR CAMBIOS",
                    onClick = onSaveClick,
                    enabled = state.canSave,
                    isLoading = state.isSaving
                )
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
