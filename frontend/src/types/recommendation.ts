/* Formulario presignado de S3 devuelto por GET /presigned-url. */
export interface PresignedUploadForm {
    url: string;
    fields: Record<string, string>;
}

export interface HaircutStyle {
    id: string;
    name: string;
    description?: string;
}

/* El LLM recomendó al menos un corte. `confidence` va de 0 a 1. */
export interface RecommendedHaircutResult {
    status: 'recommended';
    haircuts: HaircutStyle[];
    suggestionText: string;
    reasoning: string;
    confidence: number;
}

/* Ningún corte existente encaja con las preferencias del cliente; `reason` explica el motivo. */
export interface NoSuitableHaircutResult {
    status: 'no_suitable_haircut';
    reason: string;
}

/* Respuesta de POST /recommendations/generate; se distingue por `status`. */
export type GeneratedRecommendation = RecommendedHaircutResult | NoSuitableHaircutResult;

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
    /* Cortes recomendados, en el orden de la IA; vacío si no hubo recomendación o los cortes fueron eliminados. */
    recommendedHaircuts: { id: string; name: string }[];
    /* Fechas en ISO. */
    requestedAt: string;
    completedAt: string | null;
}
