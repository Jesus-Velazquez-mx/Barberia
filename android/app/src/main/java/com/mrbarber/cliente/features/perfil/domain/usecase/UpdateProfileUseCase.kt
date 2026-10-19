package com.mrbarber.cliente.features.perfil.domain.usecase

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.util.Validators
import com.mrbarber.cliente.features.perfil.domain.model.Profile
import com.mrbarber.cliente.features.perfil.domain.repository.ProfileRepository
import java.time.LocalDate
import javax.inject.Inject

class UpdateProfileUseCase @Inject constructor(
    private val repository: ProfileRepository
) {
    suspend operator fun invoke(profile: Profile): Result<Profile> {
        val clean = profile.copy(
            firstName = profile.firstName.trim(),
            lastName = profile.lastName.trim(),
            email = profile.email.trim(),
            phone = profile.phone.trim()
        )
        validate(clean)?.let { return Result.failure(AppException.Validation(it)) }
        return repository.updateProfile(clean)
    }

    /** Las reglas replican las del backend (PUT /api/users). */
    private fun validate(profile: Profile): String? = when {
        profile.firstName.length < 2 -> "El nombre debe tener al menos 2 letras"
        profile.lastName.length < 2 -> "El apellido debe tener al menos 2 letras"
        !Validators.isValidEmail(profile.email) -> "El correo no tiene un formato válido"
        profile.phone.length != 10 || !profile.phone.all(Char::isDigit) -> "El teléfono debe tener 10 dígitos"
        profile.birthDate == null -> "Selecciona tu fecha de nacimiento"
        profile.birthDate.isAfter(LocalDate.now()) -> "La fecha de nacimiento no puede ser futura"
        profile.gender == null -> "Selecciona tu género"
        else -> null
    }
}
