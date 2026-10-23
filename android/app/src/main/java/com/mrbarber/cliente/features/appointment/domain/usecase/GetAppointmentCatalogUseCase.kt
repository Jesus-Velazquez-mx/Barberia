package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.features.appointment.domain.model.OfferedService
import com.mrbarber.cliente.features.appointment.domain.model.Shop
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import javax.inject.Inject

/** Sucursales y servicios con los que arranca la pantalla de agendar. */
data class AppointmentCatalog(
    val shops: List<Shop>,
    val services: List<OfferedService>
)

class GetAppointmentCatalogUseCase @Inject constructor(
    private val repository: AppointmentRepository
) {
    suspend operator fun invoke(): Result<AppointmentCatalog> = coroutineScope {
        val shops = async { repository.getShops() }
        val services = async { repository.getOfferedServices() }
        val shopList = shops.await().getOrElse { return@coroutineScope Result.failure(it) }
        val serviceList = services.await().getOrElse { return@coroutineScope Result.failure(it) }
        Result.success(
            AppointmentCatalog(
                shops = shopList.sortedBy { it.name },
                services = serviceList.sortedBy { it.name }
            )
        )
    }
}
