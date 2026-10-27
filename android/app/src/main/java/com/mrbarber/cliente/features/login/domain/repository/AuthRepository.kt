package com.mrbarber.cliente.features.login.domain.repository

import com.mrbarber.cliente.features.login.domain.model.User

interface AuthRepository {
    suspend fun login(email: String, password: String): Result<User>
}
