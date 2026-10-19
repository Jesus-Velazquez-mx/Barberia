package com.mrbarber.cliente.features.perfil.data.remote

import com.mrbarber.cliente.core.network.ApiResponse
import com.mrbarber.cliente.features.perfil.data.remote.dto.UpdateUserRequestDto
import com.mrbarber.cliente.features.perfil.data.remote.dto.UserResponseDto
import kotlinx.serialization.json.JsonElement
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.PUT
import retrofit2.http.Path

interface UserApi {

    @PUT("api/users")
    suspend fun updateUser(@Body body: UpdateUserRequestDto): ApiResponse<UserResponseDto>

    @DELETE("api/users/{id}")
    suspend fun deleteUser(@Path("id") id: String): ApiResponse<JsonElement>
}
