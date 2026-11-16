package com.mrbarber.cliente.features.notifications.domain.repository

interface TelegramRepository {
    /** Enlace al bot con el id del cliente, para vincular su chat. */
    suspend fun getLinkUrl(): Result<String>
    suspend fun isLinked(): Result<Boolean>
}