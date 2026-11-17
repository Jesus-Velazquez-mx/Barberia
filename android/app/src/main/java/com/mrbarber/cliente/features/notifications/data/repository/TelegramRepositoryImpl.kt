package com.mrbarber.cliente.features.notifications.data.repository

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.datastore.SessionStorage
import com.mrbarber.cliente.core.network.safeApiCall
import com.mrbarber.cliente.features.notifications.data.remote.TelegramApi
import com.mrbarber.cliente.features.notifications.domain.repository.TelegramRepository
import javax.inject.Inject
import kotlinx.coroutines.flow.first
import kotlinx.serialization.json.Json

class TelegramRepositoryImpl @Inject constructor(
    private val api: TelegramApi,
    private val sessionStorage: SessionStorage,
    private val json: Json
) : TelegramRepository {

    override suspend fun getLinkUrl(): Result<String> {
        val userId = currentUserId() ?: return noSession()
        return Result.success("https://t.me/$BOT_USERNAME?start=$userId")
    }

    override suspend fun isLinked(): Result<Boolean> {
        val userId = currentUserId() ?: return noSession()
        return safeApiCall(json) { api.getClient(userId) }
            .map { it.clientTelegramId != null }
    }

    private suspend fun currentUserId(): String? = sessionStorage.session.first()?.user?.id

    private fun noSession() = Result.failure<Nothing>(AppException.Http(401, "No hay una sesión activa"))

    private companion object {
        const val BOT_USERNAME = "MrBarberNotificationBot"
    }
}