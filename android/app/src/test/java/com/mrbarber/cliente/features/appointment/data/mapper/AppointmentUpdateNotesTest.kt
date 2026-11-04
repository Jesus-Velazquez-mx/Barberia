package com.mrbarber.cliente.features.appointment.data.mapper

import com.mrbarber.cliente.features.appointment.domain.model.AppointmentUpdate
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Test

/** El backend distingue notas ausentes (no cambian) de `null` (se borran). */
class AppointmentUpdateNotesTest {
    // Misma configuración de nulos que NetworkModule.
    private val json = Json { explicitNulls = false }

    private fun body(notes: String?) = json.encodeToString(AppointmentUpdate(notes = notes).toRequestDto())

    @Test
    fun `notas sin cambios no se envian`() = assertEquals("{}", body(null))

    @Test
    fun `notas vacias se envian como null para borrarlas`() = assertEquals("""{"notes":null}""", body(""))

    @Test
    fun `notas con texto se envian`() = assertEquals("""{"notes":"Sin barba"}""", body("Sin barba"))
}
