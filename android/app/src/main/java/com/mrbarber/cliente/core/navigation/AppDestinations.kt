package com.mrbarber.cliente.core.navigation

import kotlinx.serialization.Serializable

@Serializable
data object LoginDestination

@Serializable
data object RegisterDestination

@Serializable
data object HomeDestination

@Serializable
data object ProfileDestination


/** Sin [appointmentId] se agenda una cita nueva; con él se modifica esa cita. */
@Serializable
data class AppointmentDestination(val appointmentId: String? = null)

@Serializable
data object MyAppointmentsDestination
