package com.mrbarber.cliente.features.recommendation.presentation

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.core.common.toUserMessage
import java.net.SocketTimeoutException

/** Mensajes específicos de la recomendación; lo demás cae en el mensaje genérico de la app. */
fun Throwable.toRecommendationMessage(): String = when {
    this is AppException.Network && cause is SocketTimeoutException ->
        "La recomendación tardó demasiado. Intenta de nuevo en un momento."
    this is AppException.Http && code == 400 ->
        "No pudimos usar tu foto. Sube una foto clara de tu rostro, de frente."
    // Solo S3 responde 403 en este flujo: el formulario venció o la foto no cumple la política.
    this is AppException.Http && code == 403 ->
        "No se pudo subir la foto. Intenta de nuevo."
    this is AppException.Http && code in 500..599 ->
        "El servicio de recomendaciones no está disponible en este momento. Intenta más tarde."
    else -> toUserMessage()
}
