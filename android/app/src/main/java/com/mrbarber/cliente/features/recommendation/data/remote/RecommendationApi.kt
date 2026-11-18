package com.mrbarber.cliente.features.recommendation.data.remote

import com.mrbarber.cliente.core.network.ApiResponse
import com.mrbarber.cliente.features.recommendation.data.remote.dto.GenerateRecommendationRequestDto
import com.mrbarber.cliente.features.recommendation.data.remote.dto.PresignedPostDto
import com.mrbarber.cliente.features.recommendation.data.remote.dto.RecommendationHistoryEntryDto
import com.mrbarber.cliente.features.recommendation.data.remote.dto.RecommendationResultDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface RecommendationApi {
    @GET("api/presigned-url")
    suspend fun getPresignedPost(): ApiResponse<PresignedPostDto>

    @POST("api/recommendations/generate")
    suspend fun generate(@Body body: GenerateRecommendationRequestDto): ApiResponse<RecommendationResultDto>

    @GET("api/recommendations")
    suspend fun getHistory(@Query("clientId") clientId: String): ApiResponse<List<RecommendationHistoryEntryDto>>
}