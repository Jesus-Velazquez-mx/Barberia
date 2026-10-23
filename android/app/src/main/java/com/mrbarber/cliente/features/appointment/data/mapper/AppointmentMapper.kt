package com.mrbarber.cliente.features.appointment.data.mapper

import com.mrbarber.cliente.features.appointment.data.remote.dto.AppointmentResponseDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.CreateAppointmentRequestDto
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import java.time.OffsetDateTime

fun NewAppointment.toRequestDto(): CreateAppointmentRequestDto = CreateAppointmentRequestDto(
    barberId = barberId,
    serviceIds = serviceIds,
    // El backend solo acepta fechas en UTC con "Z" (p. ej. 2026-10-20T15:00:00Z).
    scheduledStart = scheduledStart.toInstant().toString(),
    notes = notes
)

fun AppointmentResponseDto.toDomain(): Appointment = Appointment(
    id = id,
    status = status,
    scheduledStart = OffsetDateTime.parse(scheduledStart),
    scheduledEnd = OffsetDateTime.parse(scheduledEnd),
    notes = notes
)
