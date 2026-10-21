package com.mrbarber.cliente.features.appointment.domain.repository

import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import com.mrbarber.cliente.features.appointment.domain.model.Appointment

interface AppointmentRepository {
    suspend fun createAppointment(newAppointment: NewAppointment): Result<Appointment>
}