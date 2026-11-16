package com.mrbarber.cliente.features.appointment.presentation.myappointments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.common.toUserMessage
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.usecase.CancelAppointmentUseCase
import com.mrbarber.cliente.features.appointment.domain.usecase.GetAppointmentCatalogUseCase
import com.mrbarber.cliente.features.appointment.domain.usecase.GetMyAppointmentsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MyAppointmentsViewModel @Inject constructor(
    private val getMyAppointmentsUseCase: GetMyAppointmentsUseCase,
    private val getAppointmentCatalogUseCase: GetAppointmentCatalogUseCase,
    private val cancelAppointmentUseCase: CancelAppointmentUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyAppointmentsUiState())
    val uiState: StateFlow<MyAppointmentsUiState> = _uiState.asStateFlow()

    // Solo cuenta la carga más reciente: si se vuelve a la pantalla varias veces, la anterior se cancela.
    private var loadJob: Job? = null

    /** La pantalla lo llama cada vez que vuelve a primer plano, p. ej. después de modificar una cita. */
    fun load() {
        loadJob?.cancel()
        _uiState.update { it.copy(isLoading = true, error = null) }
        loadJob = viewModelScope.launch {
            val catalog = async { getAppointmentCatalogUseCase() }
            getMyAppointmentsUseCase()
                .onSuccess { appointments ->
                    // Sin catálogo la lista se muestra igual, solo sin nombres de sucursal y servicios.
                    val names = catalog.await().getOrNull()
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            appointments = appointments,
                            shopNames = names?.shops?.associate { it.id to it.name } ?: state.shopNames,
                            serviceNames = names?.services?.associate { it.id to it.name } ?: state.serviceNames
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.toUserMessage()) }
                }
        }
    }

    fun onCancelClick(appointment: Appointment) =
        _uiState.update { it.copy(appointmentToCancel = appointment, cancelReason = "", error = null) }

    fun onCancelReasonChanged(reason: String) =
        _uiState.update { it.copy(cancelReason = reason.take(CancelAppointmentUseCase.MAX_REASON_LENGTH)) }

    fun onCancelDismiss() = _uiState.update { it.copy(appointmentToCancel = null) }

    fun onCancelConfirm() {
        val appointment = _uiState.value.appointmentToCancel ?: return
        val reason = _uiState.value.cancelReason
        _uiState.update { it.copy(appointmentToCancel = null, cancellingId = appointment.id) }
        viewModelScope.launch {
            cancelAppointmentUseCase(appointment.id, reason)
                .onSuccess { cancelled ->
                    _uiState.update { state ->
                        state.copy(
                            cancellingId = null,
                            appointments = state.appointments.filterNot { it.id == cancelled.id }
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        if (e is AppException.Http && e.code == 404) {
                            it.copy(cancellingId = null, unavailableMessage = "La cita ya no está disponible")
                        } else {
                            it.copy(cancellingId = null, error = e.toCancelMessage())
                        }
                    }
                }
        }
    }

    /** Se recarga la lista para que deje de mostrar la cita que ya no existe. */
    fun onUnavailableAccepted() {
        _uiState.update { it.copy(unavailableMessage = null) }
        load()
    }

    private fun Throwable.toCancelMessage(): String = when {
        this is AppException.Http && code == 403 ->
            "Solo puedes cancelar una cita con ${Appointment.MIN_HOURS_BEFORE} horas o más de anticipación"
        this is AppException.Http && code == 409 -> "Esta cita ya no se puede cancelar"
        else -> toUserMessage()
    }
}
