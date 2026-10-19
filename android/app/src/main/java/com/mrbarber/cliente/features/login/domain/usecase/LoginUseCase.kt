package com.mrbarber.cliente.features.login.domain.usecase

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.util.Validators
import com.mrbarber.cliente.features.login.domain.model.User
import com.mrbarber.cliente.features.login.domain.repository.AuthRepository
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val repository: AuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Result<User> {
        val cleanEmail = email.trim()
        if (cleanEmail.isBlank() || password.isBlank()) {
            return Result.failure(AppException.Validation("Ingresa tu correo y contraseña"))
        }
        if (!Validators.isValidEmail(cleanEmail)) {
            return Result.failure(AppException.Validation("El correo no tiene un formato válido"))
        }
        return repository.login(cleanEmail, password)
    }
}
