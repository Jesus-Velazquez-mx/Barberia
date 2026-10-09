import type { HaircutStyleDTO } from "../recommendation.interface.js";

interface InternalAIRequest<T> {
    data: T;
    provider: string
}

interface InternalAIRecommendationRequest {
    suggestedHaircuts: HaircutStyleDTO[];
    photo: string;
    userData: {
        age: number;
        gender: string;
        userPreferences?: string;
    }
}

interface InternalAIResponse<T> {
    data?: T;
    message: string;
    errors?: AIContentError[];
}

type AIContentError = {
    field?: string,
    detail: string
}

export type {
    InternalAIRequest,
    InternalAIRecommendationRequest,
    InternalAIResponse
};