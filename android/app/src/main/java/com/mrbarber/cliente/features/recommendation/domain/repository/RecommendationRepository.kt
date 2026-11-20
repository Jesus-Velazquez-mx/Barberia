package com.mrbarber.cliente.features.recommendation.domain.repository

import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationHistoryEntry
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationResult

interface RecommendationRepository {
    suspend fun uploadFacePhoto(photoUri: String): Result<Unit>
    suspend fun generateRecommendation(preferences: String?): Result<RecommendationResult>
    suspend fun getHistory(): Result<List<RecommendationHistoryEntry>>

    /** URL prefirmada de la foto de catálogo del corte; dura pocos minutos, así que se pide al momento de mostrarla. */
    suspend fun getHaircutImageUrl(haircutId: String): Result<String>
}