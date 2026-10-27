interface RecommendationHealthResponse {
    status: string;
}

type HaircutStyleDTO = {
    id: string;
    name: string;
    description?: string;
};

interface HaircutRecommendationRequest {
    userPreferences?: string;
}

/** El LLM eligió al menos un corte de los candidatos. */
interface RecommendedHaircutResponse {
    status: 'recommended';
    haircuts: HaircutStyleDTO[];
    suggestionText: string;
    reasoning: string;
    confidence: number;
}

/** Ningún corte existente encaja con las preferencias del cliente; `reason` la redacta el LLM. */
interface NoSuitableHaircutResponse {
    status: 'no_suitable_haircut';
    reason: string;
}

type HaircutRecommendationResponse = RecommendedHaircutResponse | NoSuitableHaircutResponse;

/** Resultado listo para enviarse al cliente web: el mensaje es una plantilla fija según el resultado. */
interface HaircutRecommendationResult {
    message: string;
    data: HaircutRecommendationResponse;
}

/** Resultado de una solicitud de recomendación guardada en el historial (las solicitudes fallidas no se exponen). */
type RecommendationHistoryStatus = 'recommended' | 'no_suitable_haircut';

interface RecommendationHistoryEntryDTO {
    id: string;
    status: RecommendationHistoryStatus;
    suggestionText: string | null;
    /** Porcentaje (0-100). */
    confidence: number | null;
    reasoning: string | null;
    /** Primer corte de la recomendación; `null` si no hubo recomendación o el corte fue eliminado. */
    recommendedHaircut: { id: string; name: string } | null;
    requestedAt: Date;
    completedAt: Date | null;
}

export type {
    RecommendationHistoryStatus,
    RecommendationHistoryEntryDTO,
    RecommendationHealthResponse,
    HaircutStyleDTO,
    HaircutRecommendationRequest,
    RecommendedHaircutResponse,
    NoSuitableHaircutResponse,
    HaircutRecommendationResponse,
    HaircutRecommendationResult,
};
