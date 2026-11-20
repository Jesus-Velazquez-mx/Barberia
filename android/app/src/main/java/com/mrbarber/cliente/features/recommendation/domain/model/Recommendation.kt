package com.mrbarber.cliente.features.recommendation.domain.model

//Datos de la recomendación

data class Haircut(val id: String, val name: String, val description: String?)

sealed interface RecommendationResult {
    data class Recommended(
        val haircuts: List<Haircut>,
        val suggestionText: String,
        val reasoning: String,
        val confidencePercent: Int
    ) : RecommendationResult

    data class NoSuitableHaircut(val reason: String) : RecommendationResult
}

data class RecommendationHistoryEntry(
    val id: String,
    val wasRecommended: Boolean,
    val suggestionText: String?,
    val confidencePercent: Int?,
    val reasoning: String?,
    /** Nombres de los cortes recomendados, del mejor al peor; vacío si no hubo corte o se eliminaron. */
    val haircutNames: List<String>,
    val requestedAt: java.time.Instant?
)