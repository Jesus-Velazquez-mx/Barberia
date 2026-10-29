package com.mrbarber.cliente.features.appointment.data.mapper

import com.mrbarber.cliente.features.appointment.data.remote.dto.BarberAvailabilityDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.BarberDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.OfferedServiceDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.ShopDto
import com.mrbarber.cliente.features.appointment.domain.model.Barber
import com.mrbarber.cliente.features.appointment.domain.model.BarberAvailability
import com.mrbarber.cliente.features.appointment.domain.model.OfferedService
import com.mrbarber.cliente.features.appointment.domain.model.Shop
import java.time.Instant

fun ShopDto.toDomain(): Shop {
    val streetLine = listOfNotNull(street, number).joinToString(" ").ifBlank { null }
    return Shop(
        id = id,
        name = name,
        address = listOfNotNull(streetLine, postalCode?.let { "C.P. $it" }).joinToString(", ")
    )
}

fun OfferedServiceDto.toDomain(): OfferedService = OfferedService(
    id = id,
    name = name,
    durationMinutes = durationMinutes,
    price = price
)

fun BarberDto.toDomain(): Barber = Barber(id = id, name = "$firstName $lastName".trim())

fun BarberAvailabilityDto.toDomain(): BarberAvailability = BarberAvailability(
    barberId = barberId,
    startTimes = startTimes.map(Instant::parse)
)
