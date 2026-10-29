package com.mrbarber.cliente.features.appointment.presentation.myappointments

import com.mrbarber.cliente.features.appointment.domain.model.Appointment

data class MyAppointmentsUiState(
    val isLoading: Boolean = false,
    val appointments: List<Appointment> = emptyList(),
    /** Nombres para mostrar en cada cita; la respuesta del backend solo trae ids. */
    val shopNames: Map<String, String> = emptyMap(),
    val serviceNames: Map<String, String> = emptyMap(),
    val appointmentToCancel: Appointment? = null,
    val cancellingId: String? = null,
    val error: String? = null
)
