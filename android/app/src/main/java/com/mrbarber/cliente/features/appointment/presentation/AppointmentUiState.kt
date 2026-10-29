package com.mrbarber.cliente.features.appointment.presentation

import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.Barber
import com.mrbarber.cliente.features.appointment.domain.model.OfferedService
import com.mrbarber.cliente.features.appointment.domain.model.Shop
import java.time.LocalDate
import java.time.LocalTime

data class AppointmentUiState(
    // Carga inicial de sucursales y servicios
    val isLoadingCatalog: Boolean = false,
    val catalogError: String? = null,
    // Paso 1: sucursal y servicios
    val shops: List<Shop> = emptyList(),
    val selectedShopId: String? = null,
    val services: List<OfferedService> = emptyList(),
    val selectedServiceIds: Set<String> = emptySet(),
    // Paso 2: día y horario
    val availableDates: List<LocalDate> = emptyList(),
    val selectedDate: LocalDate? = null,
    /** Horarios libres por barbero para la sucursal, servicios y día elegidos (hora de la sucursal). */
    val timesByBarber: Map<String, List<LocalTime>> = emptyMap(),
    val selectedTime: LocalTime? = null,
    val isLoadingSlots: Boolean = false,
    // Paso 3: barbero libre en el horario elegido
    val barbers: List<Barber> = emptyList(),
    val isLoadingBarbers: Boolean = false,
    val selectedBarberId: String? = null,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val createdAppointment: Appointment? = null
) {
    val selectedShop: Shop? get() = shops.find { it.id == selectedShopId }
    val selectedServices: List<OfferedService> get() = services.filter { it.id in selectedServiceIds }
    val selectedBarber: Barber? get() = barbers.find { it.id == selectedBarberId }
    val totalPrice: Double get() = selectedServices.sumOf { it.price }
    val totalDurationMinutes: Int get() = selectedServices.sumOf { it.durationMinutes }

    /** Horarios en que al menos un barbero está libre. */
    val timeSlots: List<LocalTime> get() = timesByBarber.values.flatten().distinct().sorted()

    /** Barberos libres en el horario elegido (vacío si aún no se elige horario). */
    val availableBarbers: List<Barber>
        get() = selectedTime?.let { time ->
            barbers.filter { time in timesByBarber[it.id].orEmpty() }
        }.orEmpty()

    val canChooseSchedule: Boolean get() = selectedShopId != null && selectedServiceIds.isNotEmpty()
    val canConfirm: Boolean
        get() = canChooseSchedule && selectedBarberId != null && selectedDate != null &&
            selectedTime != null && !isSubmitting
}
