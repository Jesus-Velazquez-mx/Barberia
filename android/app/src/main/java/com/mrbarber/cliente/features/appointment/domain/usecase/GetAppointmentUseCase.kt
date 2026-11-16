package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import javax.inject.Inject

/** Una cita del cliente, para precargarla al modificarla. */
class GetAppointmentUseCase @Inject constructor(
    private val repository: AppointmentRepository
) {
    suspend operator fun invoke(id: String): Result<Appointment> = repository.getAppointment(id)
}
