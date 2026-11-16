package com.mrbarber.cliente.features.notifications.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class TelegramStatusDto(
    val clientTelegramId: String? = null
)
