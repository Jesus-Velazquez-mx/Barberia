package com.mrbarber.cliente.features.recommendation.data.repository

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.datastore.SessionStorage
import com.mrbarber.cliente.core.network.safeApiCall
import com.mrbarber.cliente.features.recommendation.data.local.PhotoCompressor
import com.mrbarber.cliente.features.recommendation.data.mapper.toDomain
import com.mrbarber.cliente.features.recommendation.data.remote.RecommendationApi
import com.mrbarber.cliente.features.recommendation.data.remote.S3PhotoUploader
import com.mrbarber.cliente.features.recommendation.data.remote.dto.GenerateRecommendationRequestDto
import com.mrbarber.cliente.features.recommendation.data.remote.dto.RecommendationParamsDto
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationHistoryEntry
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationResult
import com.mrbarber.cliente.features.recommendation.domain.repository.RecommendationRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.first
import kotlinx.serialization.json.Json
import javax.inject.Inject

class RecommendationRepositoryImpl @Inject constructor(
    private val api: RecommendationApi,
    private val uploader: S3PhotoUploader,
    private val compressor: PhotoCompressor,
    private val sessionStorage: SessionStorage,
    private val json: Json
) : RecommendationRepository {

    override suspend fun uploadFacePhoto(photoUri: String): Result<Unit> {
        // Se comprime antes de pedir el formulario: el formulario firmado solo dura 120 s.
        val photo = appCatching { compressor.compress(photoUri) }.getOrElse { return Result.failure(it) }
        val presigned = safeApiCall(json) { api.getPresignedPost() }.getOrElse { return Result.failure(it) }
        return appCatching { uploader.upload(presigned, photo) }
    }

    override suspend fun generateRecommendation(preferences: String?): Result<RecommendationResult> =
        safeApiCall(json) {
            api.generate(GenerateRecommendationRequestDto(RecommendationParamsDto(userPreferences = preferences)))
        }.mapCatching { it.toDomain() }

    override suspend fun getHistory(): Result<List<RecommendationHistoryEntry>> {
        val userId = sessionStorage.session.first()?.user?.id
            ?: return Result.failure(AppException.Http(401, "No hay una sesión activa"))
        return safeApiCall(json) { api.getHistory(userId) }
            .map { entries -> entries.map { it.toDomain() } }
    }

    /** Como runCatching, pero deja pasar la cancelación y envuelve lo inesperado en [AppException]. */
    private inline fun <T> appCatching(block: () -> T): Result<T> =
        try {
            Result.success(block())
        } catch (e: CancellationException) {
            throw e
        } catch (e: AppException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(AppException.Unknown(e))
        }
}
