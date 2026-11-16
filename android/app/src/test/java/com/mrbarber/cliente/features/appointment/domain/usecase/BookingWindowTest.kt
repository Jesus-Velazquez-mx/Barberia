package com.mrbarber.cliente.features.appointment.domain.usecase

import com.mrbarber.cliente.features.appointment.domain.usecase.CreateAppointmentUseCase.Companion.isWithinBookingWindow
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate
import java.time.OffsetDateTime

/** El negocio está en America/Mazatlan (UTC-7): hoy + 30 días es el 3 de diciembre. */
class BookingWindowTest {
    private val today = LocalDate.parse("2026-11-03")

    private fun allowed(start: String) = isWithinBookingWindow(OffsetDateTime.parse(start), today)

    @Test
    fun `el dia 30 se puede agendar hasta el final del dia`() =
        assertTrue(allowed("2026-12-03T23:59:00-07:00"))

    @Test
    fun `el dia 31 se rechaza desde su primer minuto`() =
        assertFalse(allowed("2026-12-04T00:00:00-07:00"))

    @Test
    fun `se usa el dia del negocio aunque en UTC ya sea el dia 31`() =
        assertTrue(allowed("2026-12-04T05:30:00Z"))

    @Test
    fun `la zona del celular no cambia el resultado`() =
        assertTrue(allowed("2026-12-04T14:30:00+09:00")) // 22:30 del día 30 en el negocio
}
