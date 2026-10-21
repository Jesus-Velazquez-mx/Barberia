package com.mrbarber.cliente.features.appointment.data.repository

import com.mrbarber.cliente.core.network.safeApiCall
import com.mrbarber.cliente.features.appointment.data.mapper.toDomain
import com.mrbarber.cliente.features.appointment.data.mapper.toRequestDto
import com.mrbarber.cliente.features.appointment.data.remote.AppointmentApi
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import kotlinx.serialization.json.Json
import javax.inject.Inject

class AppointmentRepositoryImpl @Inject constructor(
    private val api: AppointmentApi,
    private val json: Json
) : AppointmentRepository {

    override suspend fun createAppointment(newAppointment: NewAppointment): Result<Appointment> =
        safeApiCall(json) { api.create(newAppointment.toRequestDto()) }
            .map { it.toDomain() }
}
