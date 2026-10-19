package com.mrbarber.cliente.features.login.di

import com.mrbarber.cliente.features.login.data.remote.AuthApi
import com.mrbarber.cliente.features.login.data.repository.AuthRepositoryImpl
import com.mrbarber.cliente.features.login.domain.repository.AuthRepository
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
abstract class AuthModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    companion object {
        @Provides
        @Singleton
        fun provideAuthApi(retrofit: Retrofit): AuthApi = retrofit.create()
    }
}
