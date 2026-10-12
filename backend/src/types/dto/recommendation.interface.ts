interface RecommendationHealthResponse {
    status: string;
}

type HaircutStyleDTO = {
    id: string;
    name: string;
    description?: string;
};

interface HaircutRecommendationRequest {
    photo: string;
    userPreferences?: string;
}

interface HaircutRecommendationResponse {
    haircuts: HaircutStyleDTO[];
    suggestonText: string;
    reasoning: string;
    confidence: number;
}

export type {
    RecommendationHealthResponse,
    HaircutStyleDTO,
    HaircutRecommendationRequest,
    HaircutRecommendationResponse,
};
