package com.mrbarber.cliente.features.booking.presentation

import java.time.LocalDate
import java.time.LocalTime

data class ShopOption(
    val id: Int,
    val name: String,
    val address: String
)

data class ServiceOption(
    val id: Int,
    val name: String,
    val durationMinutes: Int,
    val price: Double
)

data class BarberOption(
    val id: Int,
    val name: String
)

data class TimeSlotOption(
    val time: LocalTime,
    val isAvailable: Boolean
)

data class BookingUiState(
    // Paso 1: sucursal y servicios
    val shops: List<ShopOption> = emptyList(),
    val selectedShopId: Int? = null,
    val services: List<ServiceOption> = emptyList(),
    val selectedServiceIds: Set<Int> = emptySet(),
    // Paso 2: barbero, día y horario
    val barbers: List<BarberOption> = emptyList(),
    val selectedBarberId: Int? = null,
    val availableDates: List<LocalDate> = emptyList(),
    val selectedDate: LocalDate? = null,
    val timeSlots: List<TimeSlotOption> = emptyList(),
    val selectedTime: LocalTime? = null,
    val isLoadingSlots: Boolean = false,
    val isSubmitting: Boolean = false,
    val error: String? = null
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
