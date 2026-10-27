package com.mrbarber.cliente.features.perfil.di

import com.mrbarber.cliente.features.perfil.data.remote.UserApi
import com.mrbarber.cliente.features.perfil.data.repository.ProfileRepositoryImpl
import com.mrbarber.cliente.features.perfil.domain.repository.ProfileRepository
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
abstract class PerfilModule {

    @Binds
    @Singleton
    abstract fun bindProfileRepository(impl: ProfileRepositoryImpl): ProfileRepository

    companion object {
        @Provides
        @Singleton
        fun provideUserApi(retrofit: Retrofit): UserApi = retrofit.create()
    }
}
