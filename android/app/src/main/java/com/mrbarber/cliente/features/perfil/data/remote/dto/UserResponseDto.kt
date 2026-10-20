package com.mrbarber.cliente.features.perfil.data.remote.dto

import kotlinx.serialization.Serializable

/** Contenido de `data` en la respuesta de PUT /api/users. */
@Serializable
data class UserResponseDto(
    val id: String,
    val role: String,
    val email: String,
    val phone: String? = null,
    val firstName: String,
    val lastName: String,
    val birthDate: String? = null,
    val gender: String? = null
)
