package com.mrbarber.cliente.features.perfil.domain.model

import java.time.LocalDate

data class Profile(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String,
    val birthDate: LocalDate?,
    val gender: Gender?
) {
    val fullName: String get() = "$firstName $lastName"
}

enum class Gender { MALE, FEMALE, OTHER }
