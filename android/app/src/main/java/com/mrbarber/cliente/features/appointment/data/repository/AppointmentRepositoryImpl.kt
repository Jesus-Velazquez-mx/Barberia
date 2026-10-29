package com.mrbarber.cliente.features.appointment.data.repository

import com.mrbarber.cliente.core.network.safeApiCall
import com.mrbarber.cliente.features.appointment.data.mapper.toDomain
import com.mrbarber.cliente.features.appointment.data.mapper.toRequestDto
import com.mrbarber.cliente.features.appointment.data.remote.AppointmentApi
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.Barber
import com.mrbarber.cliente.features.appointment.domain.model.BarberAvailability
import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import com.mrbarber.cliente.features.appointment.domain.model.OfferedService
import com.mrbarber.cliente.features.appointment.domain.model.Shop
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import kotlinx.serialization.json.Json
import java.time.LocalDate
import javax.inject.Inject

class AppointmentRepositoryImpl @Inject constructor(
    private val api: AppointmentApi,
    private val json: Json
) : AppointmentRepository {

    override suspend fun createAppointment(newAppointment: NewAppointment): Result<Appointment> =
        safeApiCall(json) { api.create(newAppointment.toRequestDto()) }
            .map { it.toDomain() }

    override suspend fun getShops(): Result<List<Shop>> =
        safeApiCall(json) { api.getShops() }
            .map { shops -> shops.map { it.toDomain() } }

    // El endpoint también devuelve servicios inactivos (lo usa el panel de administración).
    override suspend fun getOfferedServices(): Result<List<OfferedService>> =
        safeApiCall(json) { api.getOfferedServices() }
            .map { services -> services.filter { it.isActive }.map { it.toDomain() } }

    // Un barbero que no acepta citas no aparece en la disponibilidad, así que tampoco se ofrece.
    override suspend fun getBarbers(shopId: String): Result<List<Barber>> =
        safeApiCall(json) { api.getBarbers(shopId) }
            .map { barbers -> barbers.filter { it.isAcceptingBookings }.map { it.toDomain() } }

    override suspend fun getAvailability(
        shopId: String,
        date: LocalDate,
        serviceIds: List<String>
    ): Result<List<BarberAvailability>> =
        safeApiCall(json) { api.getAvailability(shopId, date.toString(), serviceIds) }
            .map { availability -> availability.map { it.toDomain() } }
}
