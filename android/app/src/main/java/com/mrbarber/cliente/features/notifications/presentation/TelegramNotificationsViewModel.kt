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
                    _uiState.update { it.copy(isLoading = false, isLinked = linked, error = null) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.toUserMessage()) }
                }
        }
    }

    fun onConnectClick() {
        viewModelScope.launch {
            getTelegramLink()
                .onSuccess { url -> _uiState.update { it.copy(linkUrl = url, error = null) } }
                .onFailure { e -> _uiState.update { it.copy(error = e.toUserMessage()) } }
        }
    }

    /** Evita que Telegram se vuelva a abrir al recomponer o al regresar a la pantalla. */
    fun onLinkOpened() = _uiState.update { it.copy(linkUrl = null) }
}
