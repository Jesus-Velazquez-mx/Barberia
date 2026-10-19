package com.mrbarber.cliente.features.perfil.domain.usecase

import com.mrbarber.cliente.features.perfil.domain.repository.ProfileRepository
import javax.inject.Inject

/** El backend usa JWT sin estado, así que cerrar sesión es borrar la sesión local. */
class LogoutUseCase @Inject constructor(
    private val repository: ProfileRepository
) {
    suspend operator fun invoke() = repository.logout()
}
