package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import java.time.OffsetDateTime
import javax.inject.Inject

class GetMyAppointmentsUseCase @Inject constructor(
    private val repository: AppointmentRepository
) {
    /**
     * El backend lista desde las 00:00 de hoy, así que puede traer citas de hoy que ya terminaron pero
     * siguen activas (nadie las marcó). No son "próximas": se descartan.
     */
    suspend operator fun invoke(): Result<List<Appointment>> {
        val now = OffsetDateTime.now()
        return repository.getMyAppointments().map { list ->
            list.filter { it.scheduledEnd.isAfter(now) }.sortedBy { it.scheduledStart }
        }
    }
}