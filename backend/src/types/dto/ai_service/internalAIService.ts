import { FacialStructureType } from '../../entities/client.interface.js';
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
    facialStructure: FacialStructureType
}

interface InternalAIRecommendationRequest {
    suggestedHaircuts: HaircutStyleDTO[];
    photoKey: string;
    userData: {
        age: number;
        gender: string;
        userPreferences?: string;
    };
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
    InternalAIResponse,
};
