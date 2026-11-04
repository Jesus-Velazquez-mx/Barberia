package com.mrbarber.cliente.features.appointment.domain.model

import java.time.LocalDate
import java.time.OffsetDateTime

data class Appointment(
    val id: String,
    val shopId: String,
    val barberId: String,
    val serviceIds: List<String>,
    val status: String,
    val scheduledStart: OffsetDateTime,
    val scheduledEnd: OffsetDateTime,
    val notes: String?,
    /** Cuándo se agendó; ancla la ventana para reagendar. */
    val createdAt: OffsetDateTime? = null
) {
    /** El backend solo deja a un cliente editar o cancelar citas activas con 8 h o más de anticipación. */
    val canModify: Boolean
        get() = status in ACTIVE_STATUSES &&
                scheduledStart.isAfter(OffsetDateTime.now().plusHours(MIN_HOURS_BEFORE))

    /** La cita ya empezó (el cliente pudo no haber llegado todavía, por eso sigue activa). */
    val hasStarted: Boolean
        get() = !scheduledStart.isAfter(OffsetDateTime.now())

    /**
     * Último día al que se puede reagendar: como en el backend, 30 días de calendario del negocio
     * contados desde el día en que se agendó, no desde hoy. Sin [createdAt] no hay límite extra.
     */
    val lastRescheduleDate: LocalDate?
        get() = createdAt?.atZoneSameInstant(BUSINESS_ZONE)?.toLocalDate()?.plusDays(RESCHEDULE_WINDOW_DAYS)

    companion object {
        const val MIN_HOURS_BEFORE = 8L
        const val MAX_NOTES_LENGTH = 500

        /** Igual que RESCHEDULE_WINDOW_DAYS en el backend. */
        const val RESCHEDULE_WINDOW_DAYS = 30L

        /** Estados en los que el cliente todavía puede editar o cancelar la cita. */
        val ACTIVE_STATUSES = listOf("scheduled", "rescheduled")
    }
}
