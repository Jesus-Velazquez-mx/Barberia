package com.mrbarber.cliente.features.recommendation.di

import com.mrbarber.cliente.features.recommendation.data.remote.RecommendationApi
import com.mrbarber.cliente.features.recommendation.data.remote.S3HttpClient
import com.mrbarber.cliente.features.recommendation.data.repository.RecommendationRepositoryImpl
import com.mrbarber.cliente.features.recommendation.domain.repository.RecommendationRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.create
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RecommendationModule {

    @Binds
    @Singleton
    abstract fun bindRecommendationRepository(impl: RecommendationRepositoryImpl): RecommendationRepository

    companion object {
        /**
         * Misma configuración que el Retrofit compartido (incluye AuthInterceptor), pero con más tiempo
         * de lectura: generar la recomendación pasa por la detección de rostro y el LLM, y tarda más de 15 s.
         */
        @Provides
        @Singleton
        fun provideRecommendationApi(retrofit: Retrofit, client: OkHttpClient): RecommendationApi =
            retrofit.newBuilder()
                .client(
                    client.newBuilder()
                        .readTimeout(AI_READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                        .build()
                )
                .build()
                .create()

        /**
         * Cliente nuevo a propósito (no `client.newBuilder()`): no debe llevar AuthInterceptor,
         * porque S3 rechaza la subida si trae `Authorization: Bearer`.
         */
        @Provides
        @Singleton
        @S3HttpClient
        fun provideS3HttpClient(): OkHttpClient =
            OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build()

        private const val AI_READ_TIMEOUT_SECONDS = 90L
    }
}
