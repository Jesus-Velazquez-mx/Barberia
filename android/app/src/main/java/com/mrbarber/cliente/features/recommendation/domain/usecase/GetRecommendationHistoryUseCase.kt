package com.mrbarber.cliente.features.recommendation.domain.usecase

import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationHistoryEntry
import com.mrbarber.cliente.features.recommendation.domain.repository.RecommendationRepository
import javax.inject.Inject

/** Historial del cliente en sesión, del más reciente al más antiguo. */
class GetRecommendationHistoryUseCase @Inject constructor(
    private val repository: RecommendationRepository
) {
    suspend operator fun invoke(): Result<List<RecommendationHistoryEntry>> = repository.getHistory()
}
