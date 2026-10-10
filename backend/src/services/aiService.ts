import chalk from 'chalk';
import globalConfig from '../config/globalConfig.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getUserById } from '../repositories/userRepository.js';
import type {
    InternalAIRecommendationRequest,
    InternalAIRequest,
    InternalAIResponse,
} from '../types/dto/ai_service/internalAIService.js';
import type {
    HaircutRecommendationRequest,
    HaircutRecommendationResponse,
    RecommendationHealthResponse,
} from '../types/dto/recommendation.interface.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { getClientByUserId } from '../repositories/clientRepository.js';
import { getActiveHaircutStyles, getActiveHaircutStylesByFacialStructure } from '../repositories/haircutRepository.js';
import { calculateAge } from './userService.js';
import type { HaircutStyle } from '../types/entities/haircutStyle.interface.js';

export const testConnection = async (): Promise<RecommendationHealthResponse> => {
    let res: Response;

    try {
        res = await fetch(`${globalConfig.AI_SERVICE_URL}/health`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error(error);
        throw new Error('Network error. Could not call AI microservice');
    }

    if (!res.ok) {
        const errorMsg = `Request to AI microservice failed with status code: ${res.status}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    return (await res.json()) as RecommendationHealthResponse;
};

/**
 * Función auxiliar para llamar al microservicio de Python y detectar la estructura facial usando la IA.
 */
export const detectFacialStructureViaAI = async (photoBase64: string): Promise<any> => {
    let res: Response;

    const payload = {
        provider: globalConfig.AI_PROVIDER,
        data: {
            photo: photoBase64,
        },
    };

    try {
        // Nota: globalConfig.AI_SERVICE_URL apunta a la base (ej. http://localhost:8000/internal/v1)
        res = await fetch(`${globalConfig.AI_SERVICE_URL}/face/detect-structure`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Api-Key': process.env.AI_SERVICE_API_KEY!,
            },
            method: 'POST',
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error(error);
        throw new Error('Network error. Could not call AI facial detection microservice');
    }

    if (!res.ok) {
        const errorMsg = `Facial detection request failed with status code: ${res.status}`;
        console.error(chalk.red(`\nERROR - ${errorMsg}`));
        const response = await res.json();
        console.error('Response from AI service:\n', response);
        throw new Error(errorMsg);
    }

    const data: any = await res.json();
    return data.data.facialStructure; // Devuelve la estructura detectada (ej: "square", "oval", etc.)
};

export const generateRecommendation = async (
    recommendationParams: HaircutRecommendationRequest,
    token: string
): Promise<InternalAIResponse<HaircutRecommendationResponse>> => {
    let res: Response;

    const performer = await isUserSessionValid(token);

    if (performer.role !== 'client') {
        throw new ApiError(ApiErrorCode.UNAUTHORIZED, 'This feature is only available for clients');
    }

    const user = await getUserById(performer.id);
    const client = await getClientByUserId(performer.id);

    if (!client || !user) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client could not be found');
    }

    let availableHaircuts: HaircutStyle[] | null = null;
    if (client.facial_structure_type) {
        availableHaircuts = await getActiveHaircutStylesByFacialStructure(client.facial_structure_type);
    } else {
        // Si el cliente no tiene una estructura facial registrada, llamamos a la IA para detectarla con la foto.
        if (recommendationParams.photo) {
            try {
                const detectedStructure = await detectFacialStructureViaAI(recommendationParams.photo);
                client.facial_structure_type = detectedStructure;
                console.log(chalk.green(`[AI Service] Estructura facial detectada exitosamente por la IA: ${detectedStructure}`));
            } catch (err) {
                console.warn(chalk.yellow('[AI Service] No se pudo detectar por IA.'));
            }
        } else {
            client.facial_structure_type = 'round';
        }

        availableHaircuts = await getActiveHaircutStylesByFacialStructure(
            client.facial_structure_type as NonNullable<typeof client.facial_structure_type>
        );
    }

    availableHaircuts = availableHaircuts ?? (await getActiveHaircutStyles());

    if (!availableHaircuts) {
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'No haircut styles were found');
    }

    const payload: InternalAIRecommendationRequest = {
        suggestedHaircuts: availableHaircuts,
        photo: recommendationParams.photo,
        userData: {
            age: calculateAge(user.birth_date),
            gender: user.gender,
            userPreferences: recommendationParams.userPreferences,
        },
    };

    try {
        res = await fetch(`${globalConfig.AI_SERVICE_URL}/haircut/recommend`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Api-Key': process.env.AI_SERVICE_API_KEY!,
            },
            method: 'POST',
            body: JSON.stringify(buildAIServicePayload(payload)),
        });
    } catch (error) {
        console.error(error);
        throw new Error('Network error. Could not call AI microservice');
    }

    if (!res.ok) {
        const errorMsg = `Request to AI microservice failed with status code: ${res.status}`;
        console.error(chalk.red(`\nERROR - ${errorMsg}`));

        const response = await res.json();
        console.error('Response from AI service:\n', response);
        throw new Error(errorMsg);
    }

    return (await res.json()) as InternalAIResponse<HaircutRecommendationResponse>;
};

const buildAIServicePayload = <T>(obj: T): InternalAIRequest<T> => {
    return {
        data: obj,
        provider: globalConfig.AI_PROVIDER,
    };
};
