package com.mrbarber.cliente.features.profile.domain.usecase

import com.mrbarber.cliente.features.profile.domain.repository.ProfileRepository
import javax.inject.Inject

/** Para clientes el backend hace un borrado definitivo (también borra su historial). */
class DeleteAccountUseCase @Inject constructor(
    private val repository: ProfileRepository
) {
    suspend operator fun invoke(): Result<Unit> = repository.deleteAccount()
}
