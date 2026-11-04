package com.mrbarber.cliente.features.appointment.domain.model

import java.time.OffsetDateTime

data class Appointment(
    val id: String,
    val shopId: String,
    val barberId: String,
    val serviceIds: List<String>,
    val status: String,
    val scheduledStart: OffsetDateTime,
    val scheduledEnd: OffsetDateTime,
    val notes: String?
) {
    /** El backend solo deja a un cliente editar o cancelar citas activas con 8 h o más de anticipación. */
    val canModify: Boolean
        get() = status in listOf("scheduled", "rescheduled") &&
                scheduledStart.isAfter(OffsetDateTime.now().plusHours(MIN_HOURS_BEFORE))

    companion object {
        const val MIN_HOURS_BEFORE = 8L
        const val MAX_NOTES_LENGTH = 500
    }
}