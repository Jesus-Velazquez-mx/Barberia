package com.mrbarber.cliente.features.login.data.remote

import com.mrbarber.cliente.core.network.ApiResponse
import com.mrbarber.cliente.features.login.data.remote.dto.LoginRequestDto
import com.mrbarber.cliente.features.login.data.remote.dto.LoginResponseDto
import com.mrbarber.cliente.features.login.data.remote.dto.RegisterRequestDto
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequestDto): ApiResponse<LoginResponseDto>

    /** Responde lo mismo que el login: el usuario creado y su token. */
    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequestDto): ApiResponse<LoginResponseDto>
}
