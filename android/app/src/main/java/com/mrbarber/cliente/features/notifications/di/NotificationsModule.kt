package com.mrbarber.cliente.features.notifications.di

import com.mrbarber.cliente.features.notifications.data.remote.TelegramApi
import com.mrbarber.cliente.features.notifications.data.repository.TelegramRepositoryImpl
import com.mrbarber.cliente.features.notifications.domain.repository.TelegramRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import retrofit2.create
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class NotificationsModule {

    @Binds
    @Singleton
    abstract fun bindTelegramRepository(impl: TelegramRepositoryImpl): TelegramRepository

    companion object {
        @Provides
        @Singleton
        fun provideTelegramApi(retrofit: Retrofit): TelegramApi = retrofit.create()
    }
}