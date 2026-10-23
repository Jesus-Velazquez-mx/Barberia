package com.mrbarber.cliente.features.appointment.domain.repository

import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.Barber
import com.mrbarber.cliente.features.appointment.domain.model.BarberAvailability
import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import com.mrbarber.cliente.features.appointment.domain.model.OfferedService
import com.mrbarber.cliente.features.appointment.domain.model.Shop
import java.time.LocalDate

interface AppointmentRepository {
    suspend fun createAppointment(newAppointment: NewAppointment): Result<Appointment>
    suspend fun getShops(): Result<List<Shop>>
    suspend fun getOfferedServices(): Result<List<OfferedService>>
    suspend fun getBarbers(shopId: String): Result<List<Barber>>
    suspend fun getAvailability(
        shopId: String,
        date: LocalDate,
        serviceIds: List<String>
    ): Result<List<BarberAvailability>>
}
