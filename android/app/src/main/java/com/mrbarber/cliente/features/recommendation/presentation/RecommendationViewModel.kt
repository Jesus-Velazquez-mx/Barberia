package com.mrbarber.cliente.features.recommendation.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.features.recommendation.domain.usecase.GetHaircutRecommendationUseCase
import com.mrbarber.cliente.features.recommendation.domain.usecase.GetRecommendationHistoryUseCase
import com.mrbarber.cliente.features.recommendation.domain.usecase.MAX_PREFERENCES_LENGTH
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RecommendationViewModel @Inject constructor(
    private val getHaircutRecommendation: GetHaircutRecommendationUseCase,
    private val getRecommendationHistory: GetRecommendationHistoryUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(RecommendationUiState())
    val uiState: StateFlow<RecommendationUiState> = _uiState.asStateFlow()

    init {
        loadHistory()
    }

    fun onPhotoSelected(uri: String) {
        _uiState.update { it.copy(photoUri = uri, isPhotoUploaded = false, error = null) }
    }

    fun onPreferencesChange(value: String) {
        _uiState.update { it.copy(preferences = value.take(MAX_PREFERENCES_LENGTH)) }
    }

    fun onCameraUnavailable() {
        _uiState.update { it.copy(error = "No se encontró una app de cámara. Elige una foto de tu galería.") }
    }

    fun onGenerateClick() {
        val state = _uiState.value
        if (!state.canGenerate) return

        // Solo se sube si es una foto nueva; si no, el backend usa la que ya tiene.
        val photoToUpload = state.photoUri.takeUnless { state.isPhotoUploaded }

        _uiState.update { it.copy(isGenerating = true, error = null, result = null) }
        viewModelScope.launch {
            getHaircutRecommendation(photoToUpload, state.preferences)
                .onSuccess { result ->
                    _uiState.update {
                        it.copy(
                            isGenerating = false,
                            result = result,
                            isPhotoUploaded = it.photoUri != null
                        )
                    }
                    loadHistory()
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isGenerating = false, error = e.toRecommendationMessage()) }
                }
        }
    }

    fun loadHistory() {
        _uiState.update { it.copy(isHistoryLoading = true, historyError = null) }
        viewModelScope.launch {
            getRecommendationHistory()
                .onSuccess { history ->
                    _uiState.update { it.copy(isHistoryLoading = false, history = history) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isHistoryLoading = false, historyError = e.toRecommendationMessage()) }
                }
        }
    }
}
