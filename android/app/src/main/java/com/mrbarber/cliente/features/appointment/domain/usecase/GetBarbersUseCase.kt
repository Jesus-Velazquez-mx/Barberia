package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.features.appointment.domain.model.Barber
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import javax.inject.Inject

class GetBarbersUseCase @Inject constructor(
    private val repository: AppointmentRepository
) {
    suspend operator fun invoke(shopId: String): Result<List<Barber>> =
        repository.getBarbers(shopId).map { barbers -> barbers.sortedBy { it.name } }
}
