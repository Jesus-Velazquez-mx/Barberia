package com.mrbarber.cliente.features.profile.data.repository

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.datastore.SessionStorage
import com.mrbarber.cliente.core.network.safeApiCall
import com.mrbarber.cliente.core.network.safeApiCallNoData
import com.mrbarber.cliente.features.profile.data.mapper.toProfile
import com.mrbarber.cliente.features.profile.data.mapper.toSessionUser
import com.mrbarber.cliente.features.profile.data.mapper.toUpdateDto
import com.mrbarber.cliente.features.profile.data.remote.UserApi
import com.mrbarber.cliente.features.profile.data.remote.dto.UpdateUserRequestDto
import com.mrbarber.cliente.features.profile.domain.model.Profile
import com.mrbarber.cliente.features.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import javax.inject.Inject

/**
 * El backend no tiene un endpoint para consultar al usuario, así que el perfil se lee
 * de la sesión guardada (llenada en el login) y se actualiza con la respuesta del PUT.
 */
class ProfileRepositoryImpl @Inject constructor(
    private val api: UserApi,
    private val sessionStorage: SessionStorage,
    private val json: Json
) : ProfileRepository {

    override fun observeProfile(): Flow<Profile?> =
        sessionStorage.session.map { it?.user?.toProfile() }

    override suspend fun updateProfile(profile: Profile): Result<Profile> =
        safeApiCall(json) { api.updateUser(UpdateUserRequestDto(profile.toUpdateDto())) }
            .map { dto ->
                val user = dto.toSessionUser()
                sessionStorage.updateUser(user)
                user.toProfile()
            }

    override suspend fun deleteAccount(): Result<Unit> {
        val userId = sessionStorage.session.first()?.user?.id
            ?: return Result.failure(AppException.Http(401, "No hay una sesión activa"))

        return safeApiCallNoData(json) { api.deleteUser(userId) }
            .onSuccess { sessionStorage.clear() }
    }

    override suspend fun logout() {
        sessionStorage.clear()
    }
}
