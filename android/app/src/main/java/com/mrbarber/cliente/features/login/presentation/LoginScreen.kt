package com.mrbarber.cliente.features.login.presentation

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
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
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mrbarber.cliente.ui.theme.MrBarberTheme
import com.mrbarber.cliente.R
import com.mrbarber.cliente.features.login.domain.model.User
import com.mrbarber.cliente.ui.components.AppTextField
import com.mrbarber.cliente.ui.components.LoadingButton
import com.mrbarber.cliente.ui.components.PasswordTextField
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro
import com.mrbarber.cliente.ui.theme.GrisOscuro

@Composable
fun LoginRoute(
    onLoginSuccess: (User) -> Unit,
    onRegisterClick: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(state.loggedInUser) {
        state.loggedInUser?.let(onLoginSuccess)
    }

    Login(
        state = state,
        onEmailChange = viewModel::onEmailChange,
        onPasswordChange = viewModel::onPasswordChange,
        onTogglePasswordVisibility = viewModel::onTogglePasswordVisibility,
        onLoginClick = viewModel::onLoginClick,
        onRegisterClick = onRegisterClick,
        modifier = modifier
    )
}

@Composable
fun Login(
    state: LoginUiState,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onTogglePasswordVisibility: () -> Unit,
    onLoginClick: () -> Unit,
    onRegisterClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        // imePadding reduce el área visible cuando aparece el teclado y verticalScroll permite
        // que el campo enfocado se desplace a la vista. heightIn(min) mantiene el contenido
        // centrado cuando el teclado está cerrado.
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
        ) {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .heightIn(min = maxHeight)
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.Center,
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
                    colors = CardDefaults.cardColors(
                        containerColor = GrisOscuro
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {

                Spacer(Modifier.height(24.dp))

                    Column(modifier = Modifier
                        .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally) {


                        Text("BIENVENIDO", fontSize = 29.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(12.dp))
                        Text("Inicia sesión para ver tu cuenta", fontSize = 15.sp, color = GrisClaro, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(12.dp))

                        AppTextField(
                            value = state.email,
                            onValueChange = onEmailChange,
                            label = "Correo electrónico",
                            enabled = !state.isLoading,
                            keyboardType = KeyboardType.Email
                        )

                        Spacer(Modifier.height(12.dp))

                        PasswordTextField(
                            value = state.password,
                            onValueChange = onPasswordChange,
                            isVisible = state.isPasswordVisible,
                            onToggleVisibility = onTogglePasswordVisibility,
                            enabled = !state.isLoading
                        )

                        Spacer(Modifier.height(8.dp))

                        Text(
                            text = "Recuperar tu contraseña",
                            fontSize = 12.sp,
                            color = Dorado,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.align(Alignment.End)
                        )

                        state.error?.let { error ->
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = error,
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 13.sp,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Spacer(Modifier.height(10.dp))

                        LoadingButton(
                            text = "INICIAR SESIÓN",
                            onClick = onLoginClick,
                            enabled = state.canSubmit,
                            isLoading = state.isLoading
                        )
                        Spacer(Modifier.height(16.dp))

                        Text(
                            fontSize = 12.sp,
                            color = GrisClaro,
                            modifier = Modifier.clickable(enabled = !state.isLoading, onClick = onRegisterClick),
                            text = buildAnnotatedString {
                                append("¿Aún no tienes cuenta con nosotros? ")
                                withStyle(style = SpanStyle(fontWeight = FontWeight.Bold, color = Dorado)) {
                                    append("Registrate")
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginPreview() {
    MrBarberTheme {
        Login(
            state = LoginUiState(),
            onEmailChange = {},
            onPasswordChange = {},
            onTogglePasswordVisibility = {},
            onLoginClick = {},
            onRegisterClick = {}
        )
    }
}
