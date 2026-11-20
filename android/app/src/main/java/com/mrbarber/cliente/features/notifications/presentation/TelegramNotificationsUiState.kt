package com.mrbarber.cliente.features.notifications.presentation

data class TelegramNotificationsUiState(
    val isLoading: Boolean = true,
    val isLinked: Boolean = false,
    /** Cuando no es null, la pantalla abre Telegram y lo vuelve a limpiar. */
    val linkUrl: String? = null,
    val error: String? = null,
    /** El error vino de consultar el estado de vinculación: "Reintentar" vuelve a consultarlo. */
    val canRetryStatus: Boolean = false
)
