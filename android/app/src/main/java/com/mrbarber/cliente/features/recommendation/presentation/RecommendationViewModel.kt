package com.mrbarber.cliente.features.recommendation.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.features.recommendation.domain.usecase.GetHaircutRecommendationUseCase
import com.mrbarber.cliente.features.recommendation.domain.usecase.GetRecommendationHistoryUseCase
import com.mrbarber.cliente.features.recommendation.domain.usecase.MAX_PREFERENCES_LENGTH
import com.mrbarber.cliente.features.recommendation.domain.model.Haircut
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationResult
import com.mrbarber.cliente.features.recommendation.domain.repository.RecommendationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RecommendationViewModel @Inject constructor(
    private val getHaircutRecommendation: GetHaircutRecommendationUseCase,
    private val getRecommendationHistory: GetRecommendationHistoryUseCase,
    private val repository: RecommendationRepository
) : ViewModel() {

    private var photoJob: Job? = null
    private var photoCheckJob: Job? = null

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

        photoCheckJob?.cancel()
        _uiState.update {
            it.copy(isGenerating = true, error = null, result = null, haircutsWithPhoto = emptySet())
        }
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
                    if (result is RecommendationResult.Recommended) checkHaircutPhotos(result.haircuts)
                    loadHistory()
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isGenerating = false, error = e.toRecommendationMessage()) }
                }
        }
    }

    /**
     * Consulta en paralelo qué cortes tienen foto. La URL obtenida aquí no se guarda: dura pocos
     * minutos, así que al tocar "Ver corte" se pide una nueva.
     */
    private fun checkHaircutPhotos(haircuts: List<Haircut>) {
        photoCheckJob = viewModelScope.launch {
            val withPhoto = haircuts.map { haircut ->
                async { haircut.id.takeIf { repository.getHaircutImageUrl(haircut.id).isSuccess } }
            }.awaitAll().filterNotNull().toSet()
            _uiState.update { it.copy(haircutsWithPhoto = withPhoto) }
        }
    }

    fun onViewHaircutPhoto(haircut: Haircut) {
        _uiState.update { it.copy(haircutPhoto = HaircutPhotoState.Loading(haircut.name)) }
        photoJob?.cancel()
        photoJob = viewModelScope.launch {
            val photo = repository.getHaircutImageUrl(haircut.id).fold(
                onSuccess = { HaircutPhotoState.Loaded(haircut.name, it) },
                onFailure = { HaircutPhotoState.Failed(haircut.name, it.toHaircutPhotoMessage()) }
            )
            _uiState.update { it.copy(haircutPhoto = photo) }
        }
    }

    fun onDismissHaircutPhoto() {
        photoJob?.cancel()
        _uiState.update { it.copy(haircutPhoto = null) }
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
