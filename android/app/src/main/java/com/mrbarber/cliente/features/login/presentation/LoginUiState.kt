package com.mrbarber.cliente.features.login.presentation

import com.mrbarber.cliente.features.login.domain.model.User

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
    val loggedInUser: User? = null
) {
    val canSubmit: Boolean
        get() = email.isNotBlank() && password.isNotBlank() && !isLoading
}
