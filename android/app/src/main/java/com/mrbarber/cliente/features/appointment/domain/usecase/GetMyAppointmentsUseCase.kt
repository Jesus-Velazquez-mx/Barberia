package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import javax.inject.Inject

class GetMyAppointmentsUseCase @Inject constructor(
    private val repository: AppointmentRepository
) {
    suspend operator fun invoke(): Result<List<Appointment>> =
        repository.getMyAppointments().map { list -> list.sortedBy { it.scheduledStart } }
}