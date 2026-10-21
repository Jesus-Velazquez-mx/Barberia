package com.mrbarber.cliente.features.booking.domain.model

import java.time.OffsetDateTime

/** Datos para crear una nueva cita. */

data class NewBooking (
    val shopId: String,
    val barberId: String,
    val serviceId: List<String>,
    val scheduledStart: OffsetDateTime,
    val notes: String? = null
)