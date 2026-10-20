package com.mrbarber.cliente.core.common

/**
 * Errores que las capas data/domain exponen hacia arriba, sin detalles de Retrofit/OkHttp.
 */
sealed class AppException(message: String? = null, cause: Throwable? = null) : Exception(message, cause) {
    /** No hubo respuesta del servidor (sin conexión, timeout, backend apagado). */
    class Network(cause: Throwable) : AppException(cause.message, cause)

    /** El servidor respondió con un código de error. */
    class Http(
        val code: Int,
        message: String?,
        val details: List<String> = emptyList()
    ) : AppException(message)

    /** Error de validación local, antes de llamar al servidor. */
    class Validation(message: String) : AppException(message)

    class Unknown(cause: Throwable) : AppException(cause.message, cause)
}
