package com.mrbarber.cliente.core.util

import java.time.LocalDate

object DateUtils {

    /**
     * El backend envía las columnas DATE como "yyyy-MM-dd" (fecha de calendario sin zona horaria),
     * así que se parsea directo a LocalDate, sin pasar por Instant ni zonas.
     */
    fun parseServerDate(value: String?): LocalDate? {
        if (value.isNullOrBlank()) return null
        return runCatching { LocalDate.parse(value.take(10)) }.getOrNull()
    }

    /** Se envía como "yyyy-MM-dd"; el backend la guarda tal cual en la columna DATE. */
    fun toServerDate(date: LocalDate): String = date.toString()
}
