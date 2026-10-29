package com.mrbarber.cliente.features.appointment.domain.model

import java.time.OffsetDateTime

data class Appointment(
    val id: String,
    val status: String,
    val scheduledStart: OffsetDateTime,
    val scheduledEnd: OffsetDateTime,
    val notes: String?
)