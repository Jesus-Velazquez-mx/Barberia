package com.mrbarber.cliente.features.appointment.domain.model

import java.time.OffsetDateTime

/** Datos para crear una nueva cita. */

data class NewAppointment (
    val shopId: String,
    val barberId: String,
    val serviceIds: List<String>,
    val scheduledStart: OffsetDateTime,
    val notes: String? = null
)