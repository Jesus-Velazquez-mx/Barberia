package com.mrbarber.cliente.features.notifications.data.remote

import com.mrbarber.cliente.core.network.ApiResponse
import com.mrbarber.cliente.features.notifications.data.remote.dto.TelegramStatusDto
import retrofit2.http.GET
import retrofit2.http.Path

interface TelegramApi {
    @GET("api/clients/{id}")
    suspend fun getClient(@Path("id") id: String): ApiResponse<TelegramStatusDto>
}