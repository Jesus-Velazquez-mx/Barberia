package com.mrbarber.cliente.features.notifications.domain.usecase

import com.mrbarber.cliente.features.notifications.domain.repository.TelegramRepository
import javax.inject.Inject

class GetTelegramLinkUseCase @Inject constructor(
    private val repository: TelegramRepository
) {
    suspend operator fun invoke(): Result<String> = repository.getLinkUrl()
}
        