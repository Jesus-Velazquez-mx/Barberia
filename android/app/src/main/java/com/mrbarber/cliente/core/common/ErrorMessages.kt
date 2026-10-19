package com.mrbarber.cliente.core.common

/** Mensaje genérico para mostrar al usuario a partir de un error de las capas data/domain. */
fun Throwable.toUserMessage(): String = when (this) {
    is AppException.Validation -> message.orEmpty()
    is AppException.Network -> "No se pudo conectar con el servidor. Revisa tu conexión."
    is AppException.Http -> when (code) {
        400 -> details.firstOrNull() ?: "Datos inválidos"
        401 -> "Tu sesión expiró. Vuelve a iniciar sesión."
        403 -> "No tienes permiso para realizar esta acción"
        404 -> "No se encontró el usuario"
        in 500..599 -> "El servidor tuvo un problema. Intenta más tarde."
        else -> message ?: "Ocurrió un error inesperado"
    }
    else -> "Ocurrió un error inesperado"
}
