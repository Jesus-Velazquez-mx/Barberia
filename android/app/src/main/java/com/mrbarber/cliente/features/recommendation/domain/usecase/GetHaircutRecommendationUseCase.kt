package com.mrbarber.cliente.features.recommendation.domain.usecase

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationResult
import com.mrbarber.cliente.features.recommendation.domain.repository.RecommendationRepository
import javax.inject.Inject

const val MAX_PREFERENCES_LENGTH = 500

/**
 * Pide una recomendación de corte. Si [photoUri] no es null, primero sube esa foto
 * (reemplaza la anterior); si es null, reutiliza la foto que el cliente ya tiene subida.
 */
class GetHaircutRecommendationUseCase @Inject constructor(
    private val repository: RecommendationRepository
) {
    suspend operator fun invoke(photoUri: String?, preferences: String): Result<RecommendationResult> {
        val trimmed = preferences.trim()
        if (trimmed.length > MAX_PREFERENCES_LENGTH) {
            return Result.failure(
                AppException.Validation("Las preferencias no pueden superar $MAX_PREFERENCES_LENGTH caracteres")
            )
        }

        if (photoUri != null) {
            repository.uploadFacePhoto(photoUri).onFailure { return Result.failure(it) }
        }

        return repository.generateRecommendation(trimmed.ifEmpty { null })
    }
}
