package com.mrbarber.cliente.core.network

import kotlinx.serialization.Serializable

/** Envoltorio común de todas las respuestas del backend: { data, message, error }. */
@Serializable
data class ApiResponse<T>(
    val data: T? = null,
    val message: String? = null,
    val error: List<String>? = null
)

/** Cuerpo de error del backend (data siempre null). */
@Serializable
data class ApiErrorBody(
    val message: String? = null,
    val error: List<String>? = null
)
