package com.mrbarber.cliente.features.appointment.data.remote.dto

import kotlinx.serialization.Serializable

/** Elemento de `data` en GET /api/shops (solo sucursales activas). */
@Serializable
data class ShopDto(
    val id: String,
    val name: String,
    val street: String? = null,
    val number: String? = null,
    val postalCode: String? = null
)

/** Elemento de `data` en GET /api/offeredServices. */
@Serializable
data class OfferedServiceDto(
    val id: String,
    val name: String,
    val durationMinutes: Int,
    val price: Double,
    val isActive: Boolean = true
)

/** Elemento de `data` en GET /api/shops/{id}/barbers. */
@Serializable
data class BarberDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val isAcceptingBookings: Boolean = true
)

/** Elemento de `data` en GET /api/shops/{id}/availability. `startTimes` son instantes UTC. */
@Serializable
data class BarberAvailabilityDto(
    val barberId: String,
    val startTimes: List<String> = emptyList()
)
