package com.mrbarber.cliente.features.perfil.data.remote.dto

import kotlinx.serialization.Serializable

/** Cuerpo de PUT /api/users. */
@Serializable
data class UpdateUserRequestDto(
    val user: UpdateUserDto
)

@Serializable
data class UpdateUserDto(
    val id: String,
    val email: String,
    val phone: String,
    val firstName: String,
    val lastName: String,
    val birthDate: String,
    val gender: String
)
