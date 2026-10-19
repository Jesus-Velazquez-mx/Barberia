package com.mrbarber.cliente.features.login.domain.model

data class User(
    val id: String,
    val role: UserRole,
    val email: String,
    val phone: String?,
    val firstName: String,
    val lastName: String,
    val facialStructureType: String?,
    val completedServicesCount: Int
) {
    val fullName: String get() = "$firstName $lastName"
}

enum class UserRole { CLIENT, MANAGER, RECEPTIONIST, UNKNOWN }
