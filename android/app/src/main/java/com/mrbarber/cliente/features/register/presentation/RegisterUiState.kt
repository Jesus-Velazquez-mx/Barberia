package com.mrbarber.cliente.features.register.presentation

import java.time.LocalDate

data class RegisterUiState(
    val firstName: String = "",
    val lastName: String = "",
    val phone: String = "",
    val birthDate: LocalDate? = null,
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val isPasswordVisible: Boolean = false,
    val isConfirmPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null
) {
    val passwordsMismatch: Boolean
        get() = confirmPassword.isNotEmpty() && password != confirmPassword

    val canSubmit: Boolean
        get() = firstName.isNotBlank() && lastName.isNotBlank() && phone.isNotBlank() &&
            birthDate != null && email.isNotBlank() && password.isNotEmpty() &&
            confirmPassword.isNotEmpty() && !passwordsMismatch && !isLoading
}
