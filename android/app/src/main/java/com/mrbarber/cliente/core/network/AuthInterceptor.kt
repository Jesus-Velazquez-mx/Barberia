package com.mrbarber.cliente.core.network

import com.mrbarber.cliente.core.datastore.SessionStorage
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Agrega el JWT guardado a cada petición, si existe. Si el backend lo rechaza con 401
 * (vencido, inválido o revocado) borra la sesión: las pantallas que la observan regresan al login.
 */
@Singleton
class AuthInterceptor @Inject constructor(
    private val sessionStorage: SessionStorage
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { sessionStorage.token.first() }
        if (token.isNullOrBlank()) {
            return chain.proceed(chain.request())
        }

        val request = chain.request().newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        val response = chain.proceed(request)

        if (response.code == 401) {
            runBlocking { sessionStorage.clearIfToken(token) }
        }
        return response
    }
}
