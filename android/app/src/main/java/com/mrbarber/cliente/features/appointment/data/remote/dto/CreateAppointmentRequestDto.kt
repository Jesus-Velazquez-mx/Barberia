package com.mrbarber.cliente.features.appointment.data.remote.dto

import kotlinx.serialization.Serializable
import java.time.OffsetDateTime

/**
 * Cuerpo de POST /api/appointments.
 */

@Serializable
data class CreateAppointmentRequestDto (
    val shopId: String,
    val barberId: String,
    val serviceIds: List<String>,
    val scheduledStart: String,
    val notes: String? = null
)

