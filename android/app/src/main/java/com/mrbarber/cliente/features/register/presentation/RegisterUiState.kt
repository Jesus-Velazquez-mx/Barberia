package com.mrbarber.cliente.features.register.presentation

import com.mrbarber.cliente.features.login.domain.model.User
import com.mrbarber.cliente.features.profile.domain.model.Gender
import java.time.LocalDate

data class RegisterUiState(
    val firstName: String = "",
    val lastName: String = "",
    val phone: String = "",
    val birthDate: LocalDate? = null,
    val gender: Gender? = null,
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val isPasswordVisible: Boolean = false,
    val isConfirmPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
    val registeredUser: User? = null
) {
    val passwordsMismatch: Boolean
        get() = confirmPassword.isNotEmpty() && password != confirmPassword

    /** El teléfono no cuenta: es el único campo opcional. */
    val canSubmit: Boolean
        get() = firstName.isNotBlank() && lastName.isNotBlank() && birthDate != null &&
            gender != null && email.isNotBlank() && password.isNotEmpty() &&
            confirmPassword.isNotEmpty() && !passwordsMismatch && !isLoading
}
