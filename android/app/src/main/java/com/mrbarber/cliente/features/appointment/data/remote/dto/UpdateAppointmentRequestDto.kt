package com.mrbarber.cliente.features.appointment.data.remote.dto

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * Cuerpo de PUT /api/appointments/{id}. Con `explicitNulls = false` los campos nulos no se envían,
 * así que solo viaja lo que cambió.
 */
@Serializable
data class UpdateAppointmentRequestDto(
    val barberId: String? = null,
    val serviceIds: List<String>? = null,
    val scheduledStart: String? = null,
    // JsonElement porque el backend distingue ausente (no cambia) de null (borra las notas),
    // y `explicitNulls = false` no enviaría un String? nulo; JsonNull sí se envía.
    val notes: JsonElement? = null
)

/** Cuerpo de PUT /api/appointments/{id}/cancel. */
@Serializable
data class CancelAppointmentRequestDto(
    val reason: String? = null
)
