package com.mrbarber.cliente.features.appointment.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.common.toUserMessage
import com.mrbarber.cliente.features.appointment.domain.model.BUSINESS_ZONE
import com.mrbarber.cliente.features.appointment.domain.model.NewAppointment
import com.mrbarber.cliente.features.appointment.domain.usecase.CreateAppointmentUseCase
import com.mrbarber.cliente.features.appointment.domain.usecase.GetAvailableTimesUseCase
import com.mrbarber.cliente.features.appointment.domain.usecase.GetBarbersUseCase
import com.mrbarber.cliente.features.appointment.domain.usecase.GetAppointmentCatalogUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import javax.inject.Inject

@HiltViewModel
class AppointmentViewModel @Inject constructor(
    private val getAppointmentCatalogUseCase: GetAppointmentCatalogUseCase,
    private val getBarbersUseCase: GetBarbersUseCase,
    private val getAvailableTimesUseCase: GetAvailableTimesUseCase,
    private val createAppointmentUseCase: CreateAppointmentUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        // El backend permite agendar desde hoy y hasta 30 días después; las sucursales cierran en domingo.
        AppointmentUiState(
            availableDates = (0L..30L)
                .map { LocalDate.now(BUSINESS_ZONE).plusDays(it) }
                .filter { it.dayOfWeek != DayOfWeek.SUNDAY }
        )
    )
    val uiState: StateFlow<AppointmentUiState> = _uiState.asStateFlow()

    // Solo cuenta la respuesta de la última selección: una petición vieja se cancela al cambiar algo.
    private var barbersJob: Job? = null
    private var slotsJob: Job? = null

    init {
        loadCatalog()
    }

    fun loadCatalog() {
        _uiState.update { it.copy(isLoadingCatalog = true, catalogError = null) }
        viewModelScope.launch {
            getAppointmentCatalogUseCase()
                .onSuccess { catalog ->
                    _uiState.update {
                        it.copy(isLoadingCatalog = false, shops = catalog.shops, services = catalog.services)
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoadingCatalog = false, catalogError = e.toUserMessage()) }
                }
        }
    }

    /** Cada sucursal tiene sus propios barberos y horarios, así que se reinicia lo elegido después. */
    fun onShopSelected(id: String) {
        if (id == _uiState.value.selectedShopId) return
        edit {
            copy(
                selectedShopId = id,
                barbers = emptyList(),
                selectedBarberId = null,
                selectedTime = null,
                timesByBarber = emptyMap()
            )
        }
        loadBarbers(id)
        loadSlots()
    }

    /** Cambiar servicios cambia la duración total, y con ella los horarios disponibles. */
    fun onServiceToggled(id: String) {
        edit {
            val ids = if (id in selectedServiceIds) selectedServiceIds - id else selectedServiceIds + id
            copy(selectedServiceIds = ids, selectedTime = null, selectedBarberId = null)
        }
        loadSlots()
    }

    fun onDateSelected(date: LocalDate) {
        if (date == _uiState.value.selectedDate) return
        edit { copy(selectedDate = date, selectedTime = null, selectedBarberId = null) }
        loadSlots()
    }

    /** Se conserva el barbero elegido solo si también está libre en el nuevo horario. */
    fun onTimeSelected(time: LocalTime) = edit {
        val barberStillFree = selectedBarberId?.let { time in timesByBarber[it].orEmpty() } == true
        copy(selectedTime = time, selectedBarberId = selectedBarberId.takeIf { barberStillFree })
    }

    // Los horarios ya vienen de todos los barberos de la sucursal: elegir barbero no pide nada.
    fun onBarberSelected(id: String) = edit { copy(selectedBarberId = id) }

    private fun loadBarbers(shopId: String) {
        barbersJob?.cancel()
        _uiState.update { it.copy(isLoadingBarbers = true) }
        barbersJob = viewModelScope.launch {
            getBarbersUseCase(shopId)
                .onSuccess { barbers ->
                    _uiState.update { it.copy(isLoadingBarbers = false, barbers = barbers) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoadingBarbers = false, error = e.toUserMessage()) }
                }
        }
    }

    /** Vuelve a pedir los horarios cuando cambia la sucursal, los servicios o el día. */
    private fun loadSlots() {
        slotsJob?.cancel()
        val state = _uiState.value
        val shopId = state.selectedShopId
        val date = state.selectedDate
        if (shopId == null || date == null || state.selectedServiceIds.isEmpty()) {
            _uiState.update { it.copy(isLoadingSlots = false, timesByBarber = emptyMap()) }
            return
        }

        _uiState.update { it.copy(isLoadingSlots = true, timesByBarber = emptyMap()) }
        slotsJob = viewModelScope.launch {
            getAvailableTimesUseCase(shopId, date, state.selectedServiceIds)
                .onSuccess { times ->
                    _uiState.update { it.copy(isLoadingSlots = false, timesByBarber = times) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoadingSlots = false, error = e.toAppointmentMessage()) }
                }
        }
    }

    fun onConfirmClick() {
        val state = _uiState.value
        if (!state.canConfirm) return
        val barberId = state.selectedBarberId ?: return
        val date = state.selectedDate ?: return
        val time = state.selectedTime ?: return

        val newAppointment = NewAppointment(
            barberId = barberId,
            serviceIds = state.selectedServiceIds.toList(),
            // La fecha y hora elegidas son hora local de la sucursal, no del dispositivo.
            scheduledStart = date.atTime(time).atZone(BUSINESS_ZONE).toOffsetDateTime()
        )

        _uiState.update { it.copy(isSubmitting = true, error = null) }
        viewModelScope.launch {
            createAppointmentUseCase(newAppointment)
                .onSuccess { appointment ->
                    _uiState.update { it.copy(isSubmitting = false, createdAppointment = appointment) }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(
                            isSubmitting = false,
                            selectedTime = null,
                            selectedBarberId = null,
                            error = e.toAppointmentMessage()
                        )
                    }
                    // El horario elegido pudo haberse ocupado: se refresca la lista para que ya no aparezca.
                    if (e is AppException.Http && e.code in listOf(409, 422)) loadSlots()
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
