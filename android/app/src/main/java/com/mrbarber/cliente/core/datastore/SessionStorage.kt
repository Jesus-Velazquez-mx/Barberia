package com.mrbarber.cliente.core.datastore

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.mrbarber.cliente.core.util.JwtUtils
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.transformLatest
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Persiste la sesión en DataStore para que sobreviva al cierre de la app.
 * Una sesión con el token vencido se considera cerrada.
 */
@Singleton
class SessionStorage @Inject constructor(
    private val dataStore: DataStore<Preferences>,
    private val json: Json
) {
    /**
     * Emite la sesión vigente, o null si no hay. Si la sesión vence mientras alguien la está
     * observando (ej. la app abierta en Home), emite null en ese momento sin esperar a otra lectura.
     */
    @OptIn(ExperimentalCoroutinesApi::class)
    val session: Flow<Session?> = dataStore.data
        .map { prefs ->
            val token = prefs[TOKEN_KEY] ?: return@map null
            val user = prefs[USER_KEY]
                ?.let { runCatching { json.decodeFromString<SessionUser>(it) }.getOrNull() }
                ?: return@map null
            Session(token, user)
        }
        .distinctUntilChanged()
        .transformLatest { session ->
            if (session == null || JwtUtils.isExpired(session.token)) {
                emit(null)
                return@transformLatest
            }
            emit(session)
            val expiresAt = JwtUtils.expiresAtMillis(session.token) ?: return@transformLatest
            delay(expiresAt - System.currentTimeMillis())
            emit(null)
        }

    val token: Flow<String?> = session.map { it?.token }

    suspend fun save(session: Session) {
        dataStore.edit {
            it[TOKEN_KEY] = session.token
            it[USER_KEY] = json.encodeToString(SessionUser.serializer(), session.user)
        }
    }

    /** Reemplaza los datos del usuario conservando el token actual. */
    suspend fun updateUser(user: SessionUser) {
        dataStore.edit { it[USER_KEY] = json.encodeToString(SessionUser.serializer(), user) }
    }

    suspend fun clear() {
        dataStore.edit {
            it.remove(TOKEN_KEY)
            it.remove(USER_KEY)
        }
    }

    /**
     * Borra la sesión solo si su token sigue siendo [token]. Así una respuesta 401 que llega tarde
     * no cierra una sesión nueva que se inició mientras tanto.
     */
    suspend fun clearIfToken(token: String) {
        dataStore.edit {
            if (it[TOKEN_KEY] == token) {
                it.remove(TOKEN_KEY)
                it.remove(USER_KEY)
            }
        }
    }

    private companion object {
        val TOKEN_KEY = stringPreferencesKey("auth_token")
        val USER_KEY = stringPreferencesKey("session_user")
    }
}
