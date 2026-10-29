package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import javax.inject.Inject
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
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
        appointment.scheduledStart.isAfter(now.plusDays(MAX_DAYS_AHEAD)) ->
            "Solo puedes agendar con hasta $MAX_DAYS_AHEAD días de anticipación"
        (appointment.notes?.length ?: 0) > 500 -> "Las notas no pueden superar 500 caracteres"
        else -> null
    }
}

private companion object {
    /** Igual que MAX_BOOKING_DAYS_AHEAD en el backend. */
    const val MAX_DAYS_AHEAD = 30L
}
}