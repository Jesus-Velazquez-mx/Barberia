package com.mrbarber.cliente.core.network

import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor

/**
 * Log de red para debug que nunca escribe en Logcat los cuerpos con credenciales:
 * en las rutas de [sensitivePathPrefixes] solo registra la línea de la petición y los headers
 * (la contraseña va en el cuerpo de la petición y el token en el de la respuesta).
 * El resto de las rutas se registran completas.
 */
class SafeLoggingInterceptor(
    private val sensitivePathPrefixes: List<String> = listOf("/api/auth/")
) : Interceptor {

    private val fullLogging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
        redactHeader("Authorization")
    }

    private val headersOnlyLogging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.HEADERS
        redactHeader("Authorization")
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        val path = chain.request().url.encodedPath
        val isSensitive = sensitivePathPrefixes.any { path.startsWith(it) }
        val logger = if (isSensitive) headersOnlyLogging else fullLogging
        return logger.intercept(chain)
    }
}
