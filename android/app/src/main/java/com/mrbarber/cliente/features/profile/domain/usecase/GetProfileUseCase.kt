package com.mrbarber.cliente.features.profile.domain.usecase

import com.mrbarber.cliente.features.profile.domain.model.Profile
import com.mrbarber.cliente.features.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetProfileUseCase @Inject constructor(
    private val repository: ProfileRepository
) {
    operator fun invoke(): Flow<Profile?> = repository.observeProfile()
}
