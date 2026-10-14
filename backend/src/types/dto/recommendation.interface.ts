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

export type {
    RecommendationHealthResponse,
    HaircutStyleDTO,
    HaircutRecommendationRequest,
    RecommendedHaircutResponse,
    NoSuitableHaircutResponse,
    HaircutRecommendationResponse,
    HaircutRecommendationResult,
};
