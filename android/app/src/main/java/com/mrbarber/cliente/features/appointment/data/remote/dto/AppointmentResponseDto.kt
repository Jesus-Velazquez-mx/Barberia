package com.mrbarber.cliente.features.appointment.data.remote.dto

import kotlinx.serialization.Serializable
import kotlin.String
import kotlin.collections.List

/** Contenido de `data` en la respuesta de POST /api/appointments.  */

@Serializable
data class AppointmentResponseDto(
    val id: String,
    val shopId: String,
    val barberId: String,
    val status: String,
    val scheduledStart: String,
    val scheduledEnd: String,
    val notes: String? = null,
    val services: List<AppointmentServiceDto> = emptyList()
){
}

@Serializable
data class AppointmentServiceDto(
    val serviceId: String,
    val priceAtBooking: Double,
    val durationMinutesAtBooking: Int
)