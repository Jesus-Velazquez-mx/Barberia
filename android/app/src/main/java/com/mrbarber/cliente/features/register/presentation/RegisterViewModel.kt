package com.mrbarber.cliente.features.register.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.features.login.domain.model.NewUser
import com.mrbarber.cliente.features.profile.domain.model.Gender
import com.mrbarber.cliente.features.register.domain.usecase.RegisterUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val registerUseCase: RegisterUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(RegisterUiState())
    val uiState: StateFlow<RegisterUiState> = _uiState.asStateFlow()

    fun onFirstNameChange(value: String) = edit { copy(firstName = value) }
    fun onLastNameChange(value: String) = edit { copy(lastName = value) }
    fun onPhoneChange(value: String) = edit { copy(phone = value.filter(Char::isDigit).take(10)) }
    fun onBirthDateChange(value: LocalDate) = edit { copy(birthDate = value) }
    fun onGenderChange(value: Gender) = edit { copy(gender = value) }
    fun onEmailChange(value: String) = edit { copy(email = value) }
    fun onPasswordChange(value: String) = edit { copy(password = value) }
    fun onConfirmPasswordChange(value: String) = edit { copy(confirmPassword = value) }

    fun onTogglePasswordVisibility() {
        _uiState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun onToggleConfirmPasswordVisibility() {
        _uiState.update { it.copy(isConfirmPasswordVisible = !it.isConfirmPasswordVisible) }
    }

    fun onRegisterClick() {
        val state = _uiState.value
        if (!state.canSubmit) return
        val birthDate = state.birthDate ?: return
        val gender = state.gender ?: return

        val newUser = NewUser(
            firstName = state.firstName,
            lastName = state.lastName,
            phone = state.phone,
            email = state.email,
            password = state.password,
            birthDate = birthDate,
            gender = gender
        )

        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            registerUseCase(newUser, state.confirmPassword)
                .onSuccess { user ->
                    _uiState.update { it.copy(isLoading = false, registeredUser = user) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.toUserMessage()) }
                }
        }
    }

    private fun edit(transform: RegisterUiState.() -> RegisterUiState) {
        _uiState.update { it.transform().copy(error = null) }
    }

    private fun Throwable.toUserMessage(): String = when (this) {
        is AppException.Validation -> message.orEmpty()
        is AppException.Network -> "No se pudo conectar con el servidor. Revisa tu conexión."
        is AppException.Http -> when (code) {
            // Los detalles de validación del backend vienen en inglés; las reglas ya se revisan antes de enviar.
            400 -> "Revisa los datos ingresados"
            // El backend responde 409 tanto para correo como para teléfono duplicado; el mensaje dice cuál.
            409 -> if (message?.contains("phone", ignoreCase = true) == true) {
                "Este teléfono ya está registrado"
            } else {
                "Este correo ya está registrado"
            }
            in 500..599 -> "El servidor tuvo un problema. Intenta más tarde."
            else -> "Ocurrió un error inesperado"
        }
        else -> "Ocurrió un error inesperado"
    }
}
