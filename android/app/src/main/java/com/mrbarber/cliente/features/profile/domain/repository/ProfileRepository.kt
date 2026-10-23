package com.mrbarber.cliente.features.profile.domain.repository

import com.mrbarber.cliente.features.profile.domain.model.Profile
import kotlinx.coroutines.flow.Flow

interface ProfileRepository {
    /** Emite null cuando no hay sesión (cerrada, eliminada o vencida). */
    fun observeProfile(): Flow<Profile?>
    suspend fun updateProfile(profile: Profile): Result<Profile>
    suspend fun deleteAccount(): Result<Unit>
    suspend fun logout()
}
