/* Resultado de una solicitud guardada en el historial (las solicitudes fallidas no se devuelven). */
export type RecommendationStatus = 'recommended' | 'no_suitable_haircut';

export interface HaircutRecommendation {
    id: string;
    status: RecommendationStatus;
    /* Texto de la recomendación; null cuando ningún corte aplicó. */
    suggestionText: string | null;
    /* Porcentaje de confianza (0-100); null cuando ningún corte aplicó. */
    confidence: number | null;
    /* Razonamiento de la IA (o el motivo por el que ningún corte aplicó). */
    reasoning: string | null;
    /* Primer corte recomendado; null si no hubo recomendación o el corte fue eliminado. */
    recommendedHaircut: { id: string; name: string } | null;
    /* Fechas en ISO. */
    requestedAt: string;
    completedAt: string | null;
}
