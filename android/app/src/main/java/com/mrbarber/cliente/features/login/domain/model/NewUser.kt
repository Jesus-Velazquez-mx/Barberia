package com.mrbarber.cliente.features.login.domain.model

import com.mrbarber.cliente.features.profile.domain.model.Gender
import java.time.LocalDate

/** Datos para crear una cuenta de cliente. */
data class NewUser(
    val firstName: String,
    val lastName: String,
    val phone: String?,
    val email: String,
    val password: String,
    val birthDate: LocalDate,
    val gender: Gender
)
