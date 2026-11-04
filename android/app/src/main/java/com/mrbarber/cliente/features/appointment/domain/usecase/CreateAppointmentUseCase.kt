package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import javax.inject.Inject
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.BUSINESS_ZONE
import java.time.LocalDate
import java.time.OffsetDateTime

class CreateAppointmentUseCase @Inject constructor(
    private val repository: AppointmentRepository
) {
    suspend operator fun invoke(newAppointment: NewAppointment): Result<Appointment> {
        val clean = newAppointment.copy(
            serviceIds = newAppointment.serviceIds.distinct(),
            // Las notas son opcionales: vacías se mandan como ausentes.
            notes = newAppointment.notes?.trim()?.ifEmpty { null }
        )
        validate(clean)?.let { return Result.failure(AppException.Validation(it)) }
        return repository.createAppointment(clean)
    }

    /** Las reglas replican las del backend (POST /api/appointments y availabilityService). */
    private fun validate(appointment: NewAppointment): String? {
    val now = OffsetDateTime.now()
    return when {
        appointment.serviceIds.isEmpty() -> "Selecciona al menos un servicio"
        appointment.barberId.isBlank() -> "Selecciona un barbero"
        !appointment.scheduledStart.isAfter(now) -> "La fecha de la cita ya pasó"
        !isWithinBookingWindow(appointment.scheduledStart) ->
            "Solo puedes agendar con hasta $MAX_DAYS_AHEAD días de anticipación"
        (appointment.notes?.length ?: 0) > 500 -> "Las notas no pueden superar 500 caracteres"
        else -> null
    }
}

companion object {
    /** Igual que MAX_BOOKING_DAYS_AHEAD en el backend. */
    private const val MAX_DAYS_AHEAD = 30L

    /** es por día de calendario del negocio, no por horas: hoy + 30 días
     * se puede agendar completo, sin importar la hora actual ni la zona horaria del celular.
     */
    internal fun isWithinBookingWindow(
        scheduledStart: OffsetDateTime,
        today: LocalDate = LocalDate.now(BUSINESS_ZONE)
    ): Boolean =
        !scheduledStart.atZoneSameInstant(BUSINESS_ZONE).toLocalDate().isAfter(today.plusDays(MAX_DAYS_AHEAD))
}
}