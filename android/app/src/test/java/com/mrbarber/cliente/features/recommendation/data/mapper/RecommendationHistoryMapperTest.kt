package com.mrbarber.cliente.features.recommendation.data.mapper

import com.mrbarber.cliente.features.recommendation.data.remote.dto.RecommendationHistoryEntryDto
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** Respuestas reales de `GET api/recommendations`, decodificadas con la configuración de NetworkModule. */
class RecommendationHistoryMapperTest {
    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        coerceInputValues = true
    }

    private fun decode(body: String) = json.decodeFromString<RecommendationHistoryEntryDto>(body).toDomain()

    @Test
    fun `recomendacion conserva los nombres de los cortes en orden`() {
        val entry = decode(
            """
            {"id":"1","status":"recommended","suggestionText":"Te queda bien","confidence":92.5,
             "reasoning":null,"recommendedHaircuts":[{"id":"a","name":"Fade clásico"},{"id":"b","name":"Crop"}],
             "requestedAt":"2026-11-10T18:30:00.000Z","completedAt":"2026-11-10T18:30:20.000Z"}
            """
        )

        assertTrue(entry.wasRecommended)
        assertEquals(listOf("Fade clásico", "Crop"), entry.haircutNames)
        assertEquals(93, entry.confidencePercent)
    }

    @Test
    fun `sin corte ideal no trae cortes`() {
        val entry = decode(
            """
            {"id":"2","status":"no_suitable_haircut","suggestionText":null,"confidence":null,
             "reasoning":"Buscas el cabello largo","recommendedHaircuts":[],"requestedAt":"2026-11-02T16:00:00Z"}
            """
        )

        assertFalse(entry.wasRecommended)
        assertTrue(entry.haircutNames.isEmpty())
        assertEquals(null, entry.confidencePercent)
    }
}
