package com.mrbarber.cliente.features.appointment.presentation

import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import java.time.LocalDate
import java.time.LocalTime

data class ShopOption(
    val id: String,
    val name: String,
    val address: String
)

data class ServiceOption(
    val id: String,
    val name: String,
    val durationMinutes: Int,
    val price: Double
)

data class BarberOption(
    val id: String,
    val name: String
)

data class TimeSlotOption(
    val time: LocalTime,
    val isAvailable: Boolean
)

data class AppointmentUiState(
    // Paso 1: sucursal y servicios
    val shops: List<ShopOption> = emptyList(),
    val selectedShopId: String? = null,
    val services: List<ServiceOption> = emptyList(),
    val selectedServiceIds: Set<String> = emptySet(),
    // Paso 2: barbero, día y horario
    val barbers: List<BarberOption> = emptyList(),
    val selectedBarberId: String? = null,
    val availableDates: List<LocalDate> = emptyList(),
    val selectedDate: LocalDate? = null,
    val timeSlots: List<TimeSlotOption> = emptyList(),
    val selectedTime: LocalTime? = null,
    val isLoadingSlots: Boolean = false,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val createdAppointment: Appointment? = null
) {
    val selectedShop: ShopOption? get() = shops.find { it.id == selectedShopId }
    val selectedServices: List<ServiceOption> get() = services.filter { it.id in selectedServiceIds }
    val selectedBarber: BarberOption? get() = barbers.find { it.id == selectedBarberId }
    val totalPrice: Double get() = selectedServices.sumOf { it.price }
    val totalDurationMinutes: Int get() = selectedServices.sumOf { it.durationMinutes }

    val canChooseSchedule: Boolean get() = selectedShopId != null && selectedServiceIds.isNotEmpty()
    val canConfirm: Boolean
        get() = canChooseSchedule && selectedBarberId != null && selectedDate != null &&
            selectedTime != null && !isSubmitting
}
