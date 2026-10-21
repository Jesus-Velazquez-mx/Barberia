package com.mrbarber.cliente.features.appointment.data.remote

import com.mrbarber.cliente.core.network.ApiResponse
import com.mrbarber.cliente.features.appointment.data.remote.dto.CreateAppointmentRequestDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.AppointmentResponseDto
import retrofit2.http.Body
import retrofit2.http.POST

interface AppointmentApi {
    @POST("api/appointments")
    suspend fun create(@Body body: CreateAppointmentRequestDto): ApiResponse<AppointmentResponseDto>
}