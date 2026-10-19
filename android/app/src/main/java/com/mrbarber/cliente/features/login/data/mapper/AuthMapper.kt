package com.mrbarber.cliente.features.login.data.mapper

import com.mrbarber.cliente.core.datastore.SessionUser
import com.mrbarber.cliente.core.util.DateUtils
import com.mrbarber.cliente.features.login.data.remote.dto.UserDto
import com.mrbarber.cliente.features.login.domain.model.User
import com.mrbarber.cliente.features.login.domain.model.UserRole

fun UserDto.toDomain(): User = User(
    id = id,
    role = when (role) {
        "client" -> UserRole.CLIENT
        "manager" -> UserRole.MANAGER
        "receptionist" -> UserRole.RECEPTIONIST
        else -> UserRole.UNKNOWN
    },
    email = email,
    phone = phone,
    firstName = firstName,
    lastName = lastName,
    facialStructureType = profile?.facialStructureType,
    completedServicesCount = profile?.completedServicesCount ?: 0
)

fun UserDto.toSessionUser(): SessionUser = SessionUser(
    id = id,
    email = email,
    firstName = firstName,
    lastName = lastName,
    role = role,
    phone = phone,
    birthDate = DateUtils.parseServerDate(birthDate)?.toString(),
    gender = gender
)
