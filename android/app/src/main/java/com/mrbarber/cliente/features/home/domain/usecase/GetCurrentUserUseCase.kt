package com.mrbarber.cliente.features.home.domain.usecase

import com.mrbarber.cliente.core.datastore.SessionStorage
import com.mrbarber.cliente.core.datastore.SessionUser
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

/** Emite el usuario de la sesión actual, o null si no hay sesión (o venció). */
class GetCurrentUserUseCase @Inject constructor(
    private val sessionStorage: SessionStorage
) {
    operator fun invoke(): Flow<SessionUser?> = sessionStorage.session.map { it?.user }
}
