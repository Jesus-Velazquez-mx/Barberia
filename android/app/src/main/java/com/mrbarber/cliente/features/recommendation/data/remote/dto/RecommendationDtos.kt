package com.mrbarber.cliente.features.recommendation.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class PresignedPostDto(val url: String, val fields: Map<String, String>)

@Serializable
data class GenerateRecommendationRequestDto(val recommendationParams: RecommendationParamsDto)

@Serializable
data class RecommendationParamsDto(val userPreferences: String? = null)

// Las dos formas de respuesta van en un solo DTO, con los campos
@Serializable
data class RecommendationResultDto(
    val status: String,
    val haircuts: List<HaircutDto> = emptyList(),
    val suggestionText: String? = null,
    val reasoning: String? = null,
    val confidence: Double? = null,   // 0..1
    val reason: String? = null
)

@Serializable
data class HaircutDto(val id: String, val name: String, val description: String? = null)

@Serializable
data class HaircutImageUrlDto(val url: String, val expiresIn: Int)

@Serializable
data class RecommendationHistoryEntryDto(
    val id: String,
    val status: String,
    val suggestionText: String? = null,
    val confidence: Double? = null,   // 0..100
    val reasoning: String? = null,
    val recommendedHaircut: HistoryHaircutDto? = null,
    val requestedAt: String? = null
)

@Serializable
data class HistoryHaircutDto(val id: String, val name: String)