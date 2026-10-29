package com.mrbarber.cliente.features.register.domain.usecase

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.util.Validators
import com.mrbarber.cliente.features.login.domain.model.NewUser
import com.mrbarber.cliente.features.login.domain.model.User
import com.mrbarber.cliente.features.login.domain.repository.AuthRepository
import java.time.LocalDate
import javax.inject.Inject

class RegisterUseCase @Inject constructor(
    private val repository: AuthRepository
) {
    suspend operator fun invoke(newUser: NewUser, confirmPassword: String): Result<User> {
        val clean = newUser.copy(
            firstName = newUser.firstName.trim(),
            lastName = newUser.lastName.trim(),
            email = newUser.email.trim(),
            // El teléfono es opcional: vacío se manda como ausente.
            phone = newUser.phone?.trim()?.ifEmpty { null }
        )
        validate(clean, confirmPassword)?.let { return Result.failure(AppException.Validation(it)) }
        return repository.register(clean)
    }

    /** Las reglas replican las del backend (POST /api/auth/register). */
    private fun validate(user: NewUser, confirmPassword: String): String? = when {
        user.firstName.length < 2 -> "El nombre debe tener al menos 2 letras"
        user.lastName.length < 2 -> "Los apellidos deben tener al menos 2 letras"
        user.phone != null && (user.phone.length != 10 || !user.phone.all(Char::isDigit)) ->
            "El teléfono debe tener 10 dígitos"
        user.birthDate.isAfter(LocalDate.now()) -> "La fecha de nacimiento no puede ser futura"
        !Validators.isValidEmail(user.email) -> "El correo no tiene un formato válido"
        user.password.length < 6 -> "La contraseña debe tener al menos 6 caracteres"
        user.password != confirmPassword -> "Las contraseñas no coinciden"
        else -> null
    }
}
