package com.mrbarber.cliente.features.notifications.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.core.common.toUserMessage
import com.mrbarber.cliente.features.notifications.domain.usecase.GetTelegramLinkUseCase
import com.mrbarber.cliente.features.notifications.domain.usecase.GetTelegramStatusUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TelegramNotificationsViewModel @Inject constructor(
    private val getTelegramLink: GetTelegramLinkUseCase,
    private val getTelegramStatus: GetTelegramStatusUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(TelegramNotificationsUiState())
    val uiState: StateFlow<TelegramNotificationsUiState> = _uiState.asStateFlow()

    /** Se llama al abrir la pantalla y cada vez que se vuelve de Telegram. */
    fun refreshStatus() {
        viewModelScope.launch {
            getTelegramStatus()
                .onSuccess { linked ->
                    _uiState.update {
                        it.copy(isLoading = false, isLinked = linked, error = null, canRetryStatus = false)
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(isLoading = false, error = e.toUserMessage(), canRetryStatus = true)
                    }
                }
        }
    }

    /** "Reintentar" tras un error al consultar el estado: muestra la carga mientras vuelve a consultar. */
    fun retryStatus() {
        _uiState.update { it.copy(isLoading = true, error = null, canRetryStatus = false) }
        refreshStatus()
    }

    fun onConnectClick() {
        viewModelScope.launch {
            getTelegramLink()
                .onSuccess { url -> _uiState.update { it.copy(linkUrl = url, error = null, canRetryStatus = false) } }
                .onFailure { e -> _uiState.update { it.copy(error = e.toUserMessage(), canRetryStatus = false) } }
        }
    }

    /** Evita que Telegram se vuelva a abrir al recomponer o al regresar a la pantalla. */
    fun onLinkOpened() = _uiState.update { it.copy(linkUrl = null) }

    /** No hay ninguna app (ni Telegram ni navegador) que pueda abrir el enlace del bot. */
    fun onLinkOpenFailed() = _uiState.update {
        it.copy(
            linkUrl = null,
            error = "No se pudo abrir Telegram. Instala la app o inténtalo desde la web.",
            canRetryStatus = false
        )
    }

    fun dismissError() = _uiState.update { it.copy(error = null, canRetryStatus = false) }
}
