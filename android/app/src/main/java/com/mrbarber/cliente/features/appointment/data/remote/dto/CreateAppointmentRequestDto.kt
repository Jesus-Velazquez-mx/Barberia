package com.mrbarber.cliente.features.appointment.data.remote.dto

import kotlinx.serialization.Serializable
import java.time.OffsetDateTime

/**
 * Cuerpo de POST /api/appointments. La sucursal no se envía: el backend la deriva del barbero.
 */

@Serializable
data class CreateAppointmentRequestDto (
    val barberId: String,
    val serviceIds: List<String>,
    val scheduledStart: String,
    val notes: String? = null
)

