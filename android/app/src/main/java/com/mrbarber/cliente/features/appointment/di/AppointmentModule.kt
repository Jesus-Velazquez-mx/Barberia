package com.mrbarber.cliente.features.appointment.di

import com.mrbarber.cliente.features.appointment.data.remote.AppointmentApi
import com.mrbarber.cliente.features.appointment.data.repository.AppointmentRepositoryImpl
import com.mrbarber.cliente.features.appointment.domain.repository.AppointmentRepository
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
abstract class AppointmentModule {

    @Binds
    @Singleton
    abstract fun bindAppointmentRepository(impl: AppointmentRepositoryImpl): AppointmentRepository

    companion object {
        @Provides
        @Singleton
        fun provideAppointmentApi(retrofit: Retrofit): AppointmentApi = retrofit.create()
    }
}
