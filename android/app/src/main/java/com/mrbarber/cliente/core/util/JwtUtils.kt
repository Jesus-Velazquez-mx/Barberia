package com.mrbarber.cliente.core.util

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import java.util.Base64

object JwtUtils {

    /**
     * Momento (epoch millis) en que vence el token según su claim `exp`, sin validar la firma
     * (eso lo hace el backend). Devuelve null si el token no tiene `exp` y 0 si está mal formado,
     * para que se trate como vencido.
     */
    fun expiresAtMillis(token: String): Long? =
        runCatching {
            val payload = token.split(".")[1]
            val decoded = String(Base64.getUrlDecoder().decode(payload))
            Json.parseToJsonElement(decoded).jsonObject["exp"]?.jsonPrimitive?.longOrNull
        }.getOrElse { return 0L }?.times(1000)

    fun isExpired(token: String, nowMillis: Long = System.currentTimeMillis()): Boolean {
        val expiresAt = expiresAtMillis(token) ?: return false
        return nowMillis >= expiresAt
    }
}
