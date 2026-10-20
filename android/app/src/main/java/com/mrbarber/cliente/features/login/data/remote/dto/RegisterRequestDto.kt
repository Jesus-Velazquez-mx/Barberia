package com.mrbarber.cliente.features.login.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * Cuerpo de POST /api/auth/register. Con `explicitNulls = false` un [phone] nulo no se envía,
 * que es lo que espera el backend (acepta el campo ausente, no `null`).
 */
@Serializable
data class RegisterRequestDto(
    val firstName: String,
    val lastName: String,
    val phone: String? = null,
    val email: String,
    val password: String,
    val birthDate: String,
    val gender: String
)
