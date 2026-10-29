package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import javax.inject.Inject

class CancelAppointmentUseCase @Inject constructor(
    private val repository: AppointmentRepository
) {
    suspend operator fun invoke(id: String, reason: String? = null): Result<Appointment> {
        val clean = reason?.trim()?.ifEmpty { null }
        if ((clean?.length ?: 0) > MAX_REASON_LENGTH) {
            return Result.failure(
                AppException.Validation("El motivo no puede superar $MAX_REASON_LENGTH caracteres")
            )
        }
        return repository.cancelAppointment(id, clean)
    }

    private companion object {
        /** Igual que el límite de `reason` en PUT /api/appointments/{id}/cancel. */
        const val MAX_REASON_LENGTH = 255
    }
}
