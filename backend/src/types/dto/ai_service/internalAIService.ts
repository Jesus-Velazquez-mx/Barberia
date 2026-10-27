import type { FacialStructureType } from '../../entities/client.interface.js';
import type { HaircutStyleDTO } from '../recommendation.interface.js';

interface InternalAIRequest<T> {
    data: T;
    provider?: string;
}

interface InternalAIFaceDetectionRequest {
    /** Key de la foto en el bucket privado de S3; el microservicio la descarga por su cuenta. */
    photoKey: string;
}

interface InternalAIFaceDetectionResponse {
    facialStructure: FacialStructureType;
}

interface InternalAIRecommendationRequest {
    suggestedHaircuts: HaircutStyleDTO[];
    photoKey: string;
    userData: {
        age: number;
        gender: string;
        facialStructure: FacialStructureType;
        userPreferences?: string;
    };
}

/**
 * Respuesta cruda de /haircut/recommend. Con `no_suitable_haircut`, `haircuts` va vacío y `reasoning`
 * es el motivo; `suggestionText` y `confidence` solo vienen con `recommended`.
 */
interface InternalAIRecommendationResponse {
    /** Puede faltar si el microservicio es una versión anterior; se interpreta como `recommended`. */
    status?: 'recommended' | 'no_suitable_haircut';
    haircuts: HaircutStyleDTO[];
    suggestionText?: string;
    reasoning: string;
    confidence?: number;
}

interface InternalAIResponse<T> {
    data?: T;
    message: string;
    errors?: AIContentError[];
}

type AIContentError = {
    field?: string;
    detail: string;
};

export type {
    InternalAIRequest,
    InternalAIFaceDetectionRequest,
    InternalAIFaceDetectionResponse,
    InternalAIRecommendationRequest,
    InternalAIRecommendationResponse,
    InternalAIResponse,
};
