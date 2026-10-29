package com.mrbarber.cliente.features.appointment.data.repository

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.network.safeApiCall
import com.mrbarber.cliente.features.appointment.data.mapper.toDomain
import com.mrbarber.cliente.features.appointment.data.mapper.toRequestDto
import com.mrbarber.cliente.features.appointment.data.remote.AppointmentApi
import com.mrbarber.cliente.features.appointment.data.remote.dto.CancelAppointmentRequestDto
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.AppointmentUpdate
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

    // Solo las citas activas: son las únicas que el cliente puede editar o cancelar.
    override suspend fun getMyAppointments(): Result<List<Appointment>> =
        safeApiCall(json) { api.getMyAppointments(ACTIVE_STATUSES) }
            .map { appointments -> appointments.map { it.toDomain() } }

    // No hay GET /api/appointments/{id}: se busca en la lista del cliente.
    override suspend fun getAppointment(id: String): Result<Appointment> =
        getMyAppointments().mapCatching { appointments ->
            appointments.find { it.id == id }
                ?: throw AppException.Validation("La cita ya no está disponible")
        }

    override suspend fun updateAppointment(id: String, update: AppointmentUpdate): Result<Appointment> =
        safeApiCall(json) { api.update(id, update.toRequestDto()) }
            .map { it.toDomain() }

    override suspend fun cancelAppointment(id: String, reason: String?): Result<Appointment> =
        safeApiCall(json) { api.cancel(id, CancelAppointmentRequestDto(reason)) }
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

    private companion object {
        val ACTIVE_STATUSES = listOf("scheduled", "rescheduled")
    }
}
