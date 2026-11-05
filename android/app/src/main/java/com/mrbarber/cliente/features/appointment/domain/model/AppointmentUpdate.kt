package com.mrbarber.cliente.features.appointment.domain.model

import java.time.OffsetDateTime

/** Cambios a una cita existente; los campos nulos no se modifican y [notes] vacío borra las notas. */
data class AppointmentUpdate(
    val barberId: String? = null,
    val serviceIds: List<String>? = null,
    val scheduledStart: OffsetDateTime? = null,
    val notes: String? = null
) {
    val isEmpty: Boolean
        get() = barberId == null && serviceIds == null && scheduledStart == null && notes == null
}
