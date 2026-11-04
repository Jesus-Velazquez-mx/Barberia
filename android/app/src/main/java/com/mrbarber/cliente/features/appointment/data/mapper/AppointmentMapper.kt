package com.mrbarber.cliente.features.appointment.data.mapper

import com.mrbarber.cliente.features.appointment.data.remote.dto.AppointmentResponseDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.CreateAppointmentRequestDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.UpdateAppointmentRequestDto
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.AppointmentUpdate
import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import java.time.OffsetDateTime
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive

fun NewAppointment.toRequestDto(): CreateAppointmentRequestDto = CreateAppointmentRequestDto(
    barberId = barberId,
    serviceIds = serviceIds,
    // El backend solo acepta fechas en UTC con "Z" (p. ej. 2026-10-20T15:00:00Z).
    scheduledStart = scheduledStart.toInstant().toString(),
    notes = notes
)

fun AppointmentUpdate.toRequestDto(): UpdateAppointmentRequestDto = UpdateAppointmentRequestDto(
    barberId = barberId,
    serviceIds = serviceIds,
    // El backend solo acepta fechas en UTC con "Z".
    scheduledStart = scheduledStart?.toInstant()?.toString(),
    notes = notes?.let { if (it.isEmpty()) JsonNull else JsonPrimitive(it) }
)

fun AppointmentResponseDto.toDomain(): Appointment = Appointment(
    id = id,
    shopId = shopId,
    barberId = barberId,
    serviceIds = services.map { it.serviceId },
    status = status,
    scheduledStart = OffsetDateTime.parse(scheduledStart),
    scheduledEnd = OffsetDateTime.parse(scheduledEnd),
    notes = notes
)
