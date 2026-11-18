package com.mrbarber.cliente.features.recommendation.data.mapper

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.features.recommendation.data.remote.dto.HaircutDto
import com.mrbarber.cliente.features.recommendation.data.remote.dto.RecommendationHistoryEntryDto
import com.mrbarber.cliente.features.recommendation.data.remote.dto.RecommendationResultDto
import com.mrbarber.cliente.features.recommendation.domain.model.Haircut
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationHistoryEntry
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationResult
import java.time.Instant
import kotlin.math.roundToInt

private const val STATUS_RECOMMENDED = "recommended"
private const val STATUS_NO_SUITABLE = "no_suitable_haircut"

/** `confidence` llega de 0 a 1 en generate; se convierte a porcentaje. */
fun RecommendationResultDto.toDomain(): RecommendationResult = when (status) {
    STATUS_RECOMMENDED -> RecommendationResult.Recommended(
        haircuts = haircuts.map { it.toDomain() },
        suggestionText = suggestionText.orEmpty(),
        reasoning = reasoning.orEmpty(),
        confidencePercent = ((confidence ?: 0.0) * 100).roundToInt().coerceIn(0, 100)
    )
    STATUS_NO_SUITABLE -> RecommendationResult.NoSuitableHaircut(reason = reason.orEmpty())
    else -> throw AppException.Http(200, "Estado de recomendación desconocido: $status")
}

fun HaircutDto.toDomain(): Haircut = Haircut(
    id = id,
    name = name,
    description = description
)

fun RecommendationHistoryEntryDto.toDomain(): RecommendationHistoryEntry = RecommendationHistoryEntry(
    id = id,
    wasRecommended = status == STATUS_RECOMMENDED,
    suggestionText = suggestionText,
    confidencePercent = confidence?.roundToInt()?.coerceIn(0, 100),
    reasoning = reasoning,
    haircutName = recommendedHaircut?.name,
    requestedAt = requestedAt?.let { runCatching { Instant.parse(it) }.getOrNull() }
)
