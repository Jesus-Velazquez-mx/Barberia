package com.mrbarber.cliente.core.datastore

import kotlinx.serialization.Serializable

/** Sesión activa: el JWT y los datos básicos del usuario que la inició. */
data class Session(
    val token: String,
    val user: SessionUser
)

@Serializable
data class SessionUser(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val phone: String? = null,
    /** Formato ISO yyyy-MM-dd. */
    val birthDate: String? = null,
    /** Valor tal como lo maneja el backend: "male", "female", "other". */
    val gender: String? = null
)
