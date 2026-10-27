package com.mrbarber.cliente.features.login.data.remote.dto

import kotlinx.serialization.Serializable

/** Contenido de `data` en la respuesta de POST /api/auth/login. */
@Serializable
data class LoginResponseDto(
    val user: UserDto,
    val token: String
)

@Serializable
data class UserDto(
    val id: String,
    val role: String,
    val email: String,
    val phone: String? = null,
    val firstName: String,
    val lastName: String,
    val birthDate: String? = null,
    val gender: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val profile: ProfileDto? = null
)

/**
 * El backend devuelve un perfil distinto según el rol; se unifican todos los campos como opcionales.
 */
@Serializable
data class ProfileDto(
    // client
    val facialStructureType: String? = null,
    val completedServicesCount: Int? = null,
    // manager
    val title: String? = null,
    // receptionist
    val shopId: String? = null,
    val shiftId: String? = null
)
