package com.mrbarber.cliente.features.appointment.presentation

import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.Barber
import com.mrbarber.cliente.features.appointment.domain.model.OfferedService
import com.mrbarber.cliente.features.appointment.domain.model.Shop
import java.time.LocalDate
import java.time.LocalTime

data class AppointmentUiState(
    // Carga inicial: sucursales y servicios, y la cita si se está modificando
    val isLoadingCatalog: Boolean = false,
    /** Falló la carga inicial; se puede reintentar. */
    val loadError: String? = null,
    /** La cita a modificar ya no existe; reintentar no ayuda. */
    val appointmentUnavailableError: String? = null,
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
    // Notas opcionales para el barbero
    val notes: String = "",
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val createdAppointment: Appointment? = null,
    // Modo edición: la cita original y el resultado de guardarla
    /** Se abrió para reagendar; a diferencia de [isEditing], se sabe desde antes de cargar la cita. */
    val isRescheduling: Boolean = false,
    val editingAppointment: Appointment? = null,
    val updatedAppointment: Appointment? = null
) {
    val isEditing: Boolean get() = editingAppointment != null

    /** Barbero de la cita original; se conserva mientras no se elija otro horario. */
    val currentBarber: Barber?
        get() = editingAppointment?.let { original -> barbers.find { it.id == original.barberId } }

    private val servicesChanged: Boolean
        get() = editingAppointment?.let { selectedServiceIds != it.serviceIds.toSet() } == true

    private val notesChanged: Boolean
        get() = editingAppointment?.let { notes.trim() != it.notes.orEmpty() } == true


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
    // Al editar, elegir horario es opcional (sin horario se conserva el actual con su barbero),
    // pero si se elige uno también hay que elegir barbero.
    val canConfirm: Boolean
        get() = when {
            !canChooseSchedule || isSubmitting -> false
            isEditing -> if (selectedTime == null) servicesChanged || notesChanged else selectedBarberId != null
            else -> selectedBarberId != null && selectedDate != null && selectedTime != null
        }
}
