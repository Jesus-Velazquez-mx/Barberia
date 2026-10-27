package com.mrbarber.cliente.core.util

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit

object DateUtils {

    /**
     * El backend envía las columnas DATE como la medianoche de su zona horaria expresada en UTC
     * (ej. 2004-10-01 llega como "2004-10-01T06:00:00.000Z"). Redondear al día UTC más cercano
     * recupera la fecha original para cualquier zona entre UTC-12 y UTC+11.
     */
    fun parseServerDate(value: String?): LocalDate? {
        if (value.isNullOrBlank()) return null
        return runCatching {
            Instant.parse(value).plus(12, ChronoUnit.HOURS).atOffset(ZoneOffset.UTC).toLocalDate()
        }.getOrElse {
            runCatching { LocalDate.parse(value.take(10)) }.getOrNull()
        }
    }

    /**
     * Se envía a mediodía y sin zona: con solo "yyyy-MM-dd" el backend lo toma como medianoche UTC
     * y, al convertirlo a su zona horaria, guarda el día anterior.
     */
    fun toServerDate(date: LocalDate): String = "${date}T12:00:00"
}
