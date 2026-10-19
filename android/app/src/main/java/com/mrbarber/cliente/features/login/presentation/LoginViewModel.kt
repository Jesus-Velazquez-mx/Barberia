package com.mrbarber.cliente.features.login.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.features.login.domain.usecase.LoginUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChange(value: String) {
        _uiState.update { it.copy(email = value, error = null) }
    }

    fun onPasswordChange(value: String) {
        _uiState.update { it.copy(password = value, error = null) }
    }

    fun onTogglePasswordVisibility() {
        _uiState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun onLoginClick() {
        val state = _uiState.value
        if (!state.canSubmit) return

        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            loginUseCase(state.email, state.password)
                .onSuccess { user ->
                    _uiState.update { it.copy(isLoading = false, loggedInUser = user) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.toUserMessage()) }
                }
        }
    }

    private fun Throwable.toUserMessage(): String = when (this) {
        is AppException.Validation -> message.orEmpty()
        is AppException.Network -> "No se pudo conectar con el servidor. Revisa tu conexión."
        is AppException.Http -> when (code) {
            400 -> details.firstOrNull() ?: "Datos inválidos"
            401, 404 -> "Correo o contraseña incorrectos"
            in 500..599 -> "El servidor tuvo un problema. Intenta más tarde."
            else -> message ?: "Ocurrió un error inesperado"
        }
        else -> "Ocurrió un error inesperado"
    }
}
