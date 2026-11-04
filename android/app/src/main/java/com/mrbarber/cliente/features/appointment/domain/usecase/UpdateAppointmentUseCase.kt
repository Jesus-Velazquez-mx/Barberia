package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.AppointmentUpdate
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import java.time.OffsetDateTime
import javax.inject.Inject

class UpdateAppointmentUseCase @Inject constructor(
    private val repository: AppointmentRepository
) {
    suspend operator fun invoke(id: String, update: AppointmentUpdate): Result<Appointment> {
        val clean = update.copy(
            serviceIds = update.serviceIds?.distinct(),
            // Vacías no se descartan: significan que el cliente borró las notas.
            notes = update.notes?.trim()
        )
        validate(clean)?.let { return Result.failure(AppException.Validation(it)) }
        return repository.updateAppointment(id, clean)
    }

    /** Las reglas replican las del backend (PUT /api/appointments/{id}). */
    private fun validate(update: AppointmentUpdate): String? = when {
        update.isEmpty -> "No hay cambios que guardar"
        update.serviceIds?.isEmpty() == true -> "Selecciona al menos un servicio"
        update.scheduledStart?.isAfter(OffsetDateTime.now()) == false -> "La fecha de la cita ya pasó"
        (update.notes?.length ?: 0) > 500 -> "Las notas no pueden superar 500 caracteres"
        else -> null
    }
}