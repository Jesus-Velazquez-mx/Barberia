package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.features.appointment.domain.model.BUSINESS_ZONE
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import java.time.LocalDate
import java.time.LocalTime
import javax.inject.Inject

/**
 * Horarios de inicio libres por barbero (id -> horas) para la sucursal, servicios y día dados.
 * El backend devuelve instantes UTC; aquí se pasan a la hora local de la sucursal.
 */
class GetAvailableTimesUseCase @Inject constructor(
    private val repository: AppointmentRepository
) {
    suspend operator fun invoke(
        shopId: String,
        date: LocalDate,
        serviceIds: Collection<String>
    ): Result<Map<String, List<LocalTime>>> =
        repository.getAvailability(shopId, date, serviceIds.distinct())
            .map { availability ->
                availability.associate { barber ->
                    barber.barberId to barber.startTimes
                        .map { it.atZone(BUSINESS_ZONE).toLocalTime() }
                        .sorted()
                }
            }
}
