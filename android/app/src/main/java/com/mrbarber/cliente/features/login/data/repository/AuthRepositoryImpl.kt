package com.mrbarber.cliente.features.login.data.repository

import com.mrbarber.cliente.core.datastore.Session
import com.mrbarber.cliente.core.datastore.SessionStorage
import com.mrbarber.cliente.core.network.safeApiCall
import com.mrbarber.cliente.features.login.data.mapper.toDomain
import com.mrbarber.cliente.features.login.data.mapper.toSessionUser
import com.mrbarber.cliente.features.login.data.remote.AuthApi
import com.mrbarber.cliente.features.login.data.remote.dto.LoginRequestDto
import com.mrbarber.cliente.features.login.domain.model.User
import com.mrbarber.cliente.features.login.domain.repository.AuthRepository
import kotlinx.serialization.json.Json
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val api: AuthApi,
    private val sessionStorage: SessionStorage,
    private val json: Json
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<User> =
        safeApiCall(json) { api.login(LoginRequestDto(email, password)) }
            .map { response ->
                sessionStorage.save(Session(response.token, response.user.toSessionUser()))
                response.user.toDomain()
            }
}
