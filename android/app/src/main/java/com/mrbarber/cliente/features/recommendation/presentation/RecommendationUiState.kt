package com.mrbarber.cliente.features.recommendation.presentation

import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationHistoryEntry
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationResult

data class RecommendationUiState(
    /** Foto elegida en esta pantalla (content:// o file://), o null si no se ha elegido ninguna. */
    val photoUri: String? = null,
    /** La foto elegida ya se subió en una recomendación anterior: no hace falta volver a subirla. */
    val isPhotoUploaded: Boolean = false,
    val preferences: String = "",
    val isGenerating: Boolean = false,
    val result: RecommendationResult? = null,
    val error: String? = null,
    val history: List<RecommendationHistoryEntry> = emptyList(),
    val isHistoryLoading: Boolean = true,
    val historyError: String? = null,
    /** Diálogo de "Ver foto" de un corte recomendado; null si está cerrado. */
    val haircutPhoto: HaircutPhotoState? = null,
    /** Ids de los cortes recomendados que tienen foto de catálogo: solo esos muestran "Ver corte". */
    val haircutsWithPhoto: Set<String> = emptySet()
) {
    /** Si ya pidió recomendaciones antes, su foto sigue en el servidor y puede reutilizarla. */
    val hasPreviousPhoto: Boolean get() = history.isNotEmpty()

    val canGenerate: Boolean get() = !isGenerating && (photoUri != null || hasPreviousPhoto)
}

sealed interface HaircutPhotoState {
    val haircutName: String

    data class Loading(override val haircutName: String) : HaircutPhotoState
    data class Loaded(override val haircutName: String, val url: String) : HaircutPhotoState
    data class Failed(override val haircutName: String, val message: String) : HaircutPhotoState
}
