package com.mrbarber.cliente.features.appointment.domain.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.LocalDate
import java.time.OffsetDateTime

/** Como en el backend, se puede reagendar hasta 30 días después del día (del negocio) en que se agendó. */
class RescheduleWindowTest {
    private fun appointment(createdAt: String?) = Appointment(
        id = "1", shopId = "s1", barberId = "b1", serviceIds = listOf("1"), status = "scheduled",
        scheduledStart = OffsetDateTime.parse("2026-11-20T17:00:00Z"),
        scheduledEnd = OffsetDateTime.parse("2026-11-20T18:00:00Z"),
        notes = null,
        createdAt = createdAt?.let(OffsetDateTime::parse)
    )

    @Test
    fun `el limite se cuenta desde el dia en que se agendo`() =
        assertEquals(LocalDate.parse("2026-11-24"), appointment("2026-10-25T18:00:00Z").lastRescheduleDate)

    @Test
    fun `se usa el dia del negocio aunque en UTC ya sea el dia siguiente`() =
        // 2026-10-26T05:00Z son las 22:00 del 25 en America/Mazatlan.
        assertEquals(LocalDate.parse("2026-11-24"), appointment("2026-10-26T05:00:00Z").lastRescheduleDate)

    @Test
    fun `sin fecha de creacion no hay limite extra`() = assertNull(appointment(null).lastRescheduleDate)
}
