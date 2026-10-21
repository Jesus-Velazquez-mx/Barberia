package com.mrbarber.cliente.features.appointment.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.common.toUserMessage
import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import com.mrbarber.cliente.features.appointment.domain.usecase.CreateAppointmentUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import javax.inject.Inject

@HiltViewModel
class AppointmentViewModel @Inject constructor(
    private val createAppointmentUseCase: CreateAppointmentUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        // El backend permite agendar desde hoy y hasta 30 días después.
        AppointmentUiState(availableDates = (0L..30L).map { LocalDate.now().plusDays(it) })
    )
    val uiState: StateFlow<AppointmentUiState> = _uiState.asStateFlow()

    // TODO: cargar sucursales, servicios, barberos y horarios cuando existan sus endpoints en la app.

    /** Cada sucursal tiene sus propios barberos y horarios, así que se reinicia lo elegido después. */
    fun onShopSelected(id: String) = edit {
        copy(selectedShopId = id, selectedBarberId = null, selectedTime = null)
    }

    /** Cambiar servicios cambia la duración total, y con ella los horarios disponibles. */
    fun onServiceToggled(id: String) = edit {
        val ids = if (id in selectedServiceIds) selectedServiceIds - id else selectedServiceIds + id
        copy(selectedServiceIds = ids, selectedTime = null)
    }

    fun onBarberSelected(id: String) = edit { copy(selectedBarberId = id, selectedTime = null) }
    fun onDateSelected(date: LocalDate) = edit { copy(selectedDate = date, selectedTime = null) }
    fun onTimeSelected(time: LocalTime) = edit { copy(selectedTime = time) }

    fun onConfirmClick() {
        val state = _uiState.value
        if (!state.canConfirm) return
        val shopId = state.selectedShopId ?: return
        val barberId = state.selectedBarberId ?: return
        val date = state.selectedDate ?: return
        val time = state.selectedTime ?: return

        val newAppointment = NewAppointment(
            shopId = shopId,
            barberId = barberId,
            serviceIds = state.selectedServiceIds.toList(),
            scheduledStart = date.atTime(time).atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )

        _uiState.update { it.copy(isSubmitting = true, error = null) }
        viewModelScope.launch {
            createAppointmentUseCase(newAppointment)
                .onSuccess { appointment ->
                    _uiState.update { it.copy(isSubmitting = false, createdAppointment = appointment) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isSubmitting = false, error = e.toAppointmentMessage()) }
                }
        }
    }

    private fun edit(transform: AppointmentUiState.() -> AppointmentUiState) {
        _uiState.update { it.transform().copy(error = null) }
    }

    private fun Throwable.toAppointmentMessage(): String = when {
        this is AppException.Http && code == 404 ->
            "La sucursal, el barbero o algún servicio ya no está disponible"
        this is AppException.Http && code == 409 -> "Ese horario acaba de ocuparse, elige otro"
        this is AppException.Http && code == 422 -> "La fecha elegida ya no se puede agendar"
        else -> toUserMessage()
    }
}
