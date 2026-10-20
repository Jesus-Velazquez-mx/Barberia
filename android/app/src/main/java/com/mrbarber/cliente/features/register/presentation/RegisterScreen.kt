package com.mrbarber.cliente.features.register.presentation

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mrbarber.cliente.R
import com.mrbarber.cliente.ui.components.AppTextField
import com.mrbarber.cliente.ui.components.BirthDateField
import com.mrbarber.cliente.ui.components.LoadingButton
import com.mrbarber.cliente.ui.components.PasswordTextField
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro
import com.mrbarber.cliente.ui.theme.GrisOscuro
import com.mrbarber.cliente.ui.theme.MrBarberTheme
import java.time.LocalDate

@Composable
fun Register(
    state: RegisterUiState,
    onFirstNameChange: (String) -> Unit,
    onLastNameChange: (String) -> Unit,
    onPhoneChange: (String) -> Unit,
    onBirthDateChange: (LocalDate) -> Unit,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onConfirmPasswordChange: (String) -> Unit,
    onTogglePasswordVisibility: () -> Unit,
    onToggleConfirmPasswordVisibility: () -> Unit,
    onRegisterClick: () -> Unit,
    onLoginClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Image(
                painter = painterResource(id = R.drawable.mrbarber_logo),
                contentDescription = "Logo de Mr Barber",
                modifier = Modifier.requiredSize(100.dp)
            )

            Spacer(Modifier.height(12.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = GrisOscuro),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("BIENVENIDO", fontSize = 29.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "Crea tu cuenta aquí",
                        fontSize = 15.sp,
                        color = GrisClaro,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(Modifier.height(4.dp))

                    AppTextField(
                        value = state.firstName,
                        onValueChange = onFirstNameChange,
                        label = "Nombre",
                        enabled = !state.isLoading
                    )
                    AppTextField(
                        value = state.lastName,
                        onValueChange = onLastNameChange,
                        label = "Apellidos",
                        enabled = !state.isLoading
                    )
                    AppTextField(
                        value = state.phone,
                        onValueChange = onPhoneChange,
                        label = "Teléfono (10 dígitos)",
                        keyboardType = KeyboardType.Phone,
                        enabled = !state.isLoading
                    )
                    BirthDateField(
                        value = state.birthDate,
                        onValueChange = onBirthDateChange,
                        enabled = !state.isLoading,
                        modifier = Modifier.fillMaxWidth()
                    )
                    AppTextField(
                        value = state.email,
                        onValueChange = onEmailChange,
                        label = "Correo electrónico",
                        keyboardType = KeyboardType.Email,
                        enabled = !state.isLoading
                    )
                    PasswordTextField(
                        value = state.password,
                        onValueChange = onPasswordChange,
                        isVisible = state.isPasswordVisible,
                        onToggleVisibility = onTogglePasswordVisibility,
                        enabled = !state.isLoading
                    )
                    PasswordTextField(
                        value = state.confirmPassword,
                        onValueChange = onConfirmPasswordChange,
                        label = "Confirmar contraseña",
                        isVisible = state.isConfirmPasswordVisible,
                        onToggleVisibility = onToggleConfirmPasswordVisibility,
                        enabled = !state.isLoading
                    )

                    if (state.passwordsMismatch) {
                        Text(
                            "Las contraseñas no coinciden",
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 13.sp,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    state.error?.let {
                        Text(
                            text = it,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 13.sp,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Spacer(Modifier.height(4.dp))

                    LoadingButton(
                        text = "CREAR CUENTA",
                        onClick = onRegisterClick,
                        enabled = state.canSubmit,
                        isLoading = state.isLoading
                    )

                    Spacer(Modifier.height(4.dp))

                    Row {
                        Text("¿Ya tienes cuenta? ", fontSize = 12.sp, color = GrisClaro)
                        Text(
                            "Inicia sesión",
                            fontSize = 12.sp,
                            color = Dorado,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.clickable(enabled = !state.isLoading, onClick = onLoginClick)
                        )
                    }
                }
            }
        }
    }
}

@Preview(showBackground = true, heightDp = 1100)
@Composable
fun RegisterPreview() {
    // Estado local solo para poder interactuar con el diseño en el modo interactivo del preview.
    var state by remember { mutableStateOf(RegisterUiState()) }

    MrBarberTheme {
        Register(
            state = state,
            onFirstNameChange = { state = state.copy(firstName = it) },
            onLastNameChange = { state = state.copy(lastName = it) },
            onPhoneChange = { state = state.copy(phone = it) },
            onBirthDateChange = { state = state.copy(birthDate = it) },
            onEmailChange = { state = state.copy(email = it) },
            onPasswordChange = { state = state.copy(password = it) },
            onConfirmPasswordChange = { state = state.copy(confirmPassword = it) },
            onTogglePasswordVisibility = { state = state.copy(isPasswordVisible = !state.isPasswordVisible) },
            onToggleConfirmPasswordVisibility = {
                state = state.copy(isConfirmPasswordVisible = !state.isConfirmPasswordVisible)
            },
            onRegisterClick = {},
            onLoginClick = {}
        )
    }
}
