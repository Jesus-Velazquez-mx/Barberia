package com.mrbarber.cliente.features.profile.data.mapper

import com.mrbarber.cliente.core.datastore.SessionUser
import com.mrbarber.cliente.core.util.DateUtils
import com.mrbarber.cliente.features.profile.data.remote.dto.UpdateUserDto
import com.mrbarber.cliente.features.profile.data.remote.dto.UserResponseDto
import com.mrbarber.cliente.features.profile.domain.model.Gender
import com.mrbarber.cliente.features.profile.domain.model.Profile
import java.time.LocalDate

fun SessionUser.toProfile(): Profile = Profile(
    id = id,
    firstName = firstName,
    lastName = lastName,
    email = email,
    phone = phone.orEmpty(),
    birthDate = birthDate?.let { runCatching { LocalDate.parse(it) }.getOrNull() },
    gender = gender.toGender()
)

fun UserResponseDto.toSessionUser(): SessionUser = SessionUser(
    id = id,
    email = email,
    firstName = firstName,
    lastName = lastName,
    role = role,
    phone = phone,
    birthDate = DateUtils.parseServerDate(birthDate)?.toString(),
    gender = gender
)

/** Solo se llama con un perfil ya validado, por eso birthDate y gender no son nulos. */
fun Profile.toUpdateDto(): UpdateUserDto = UpdateUserDto(
    id = id,
    email = email,
    phone = phone,
    firstName = firstName,
    lastName = lastName,
    birthDate = DateUtils.toServerDate(requireNotNull(birthDate)),
    gender = requireNotNull(gender).toApi()
)

private fun String?.toGender(): Gender? = when (this) {
    "male" -> Gender.MALE
    "female" -> Gender.FEMALE
    "other" -> Gender.OTHER
    else -> null
}

fun Gender.toApi(): String = when (this) {
    Gender.MALE -> "male"
    Gender.FEMALE -> "female"
    Gender.OTHER -> "other"
}
