package com.mrbarber.cliente.features.appointment.domain.model

import java.time.Instant
import java.time.ZoneId

/**
 * Zona horaria de las sucursales: fechas y horarios de las citas siempre se manejan en ella,
 * no en la del dispositivo. Debe coincidir con BUSINESS_TIMEZONE del backend (backend/src/utils/businessTime.ts).
 */
val BUSINESS_ZONE: ZoneId = ZoneId.of("America/Mazatlan")

data class Shop(
    val id: String,
    val name: String,
    val address: String
)

data class OfferedService(
    val id: String,
    val name: String,
    val durationMinutes: Int,
    val price: Double
)

data class Barber(
    val id: String,
    val name: String
)

/** Horarios de inicio agendables de un barbero en un día. */
data class BarberAvailability(
    val barberId: String,
    val startTimes: List<Instant>
)
