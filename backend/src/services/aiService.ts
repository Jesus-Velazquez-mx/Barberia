import chalk from 'chalk';
import globalConfig from '../config/globalConfig.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getUserById } from '../repositories/userRepository.js';
import type {
    InternalAIFaceDetectionRequest,
    InternalAIFaceDetectionResponse,
    InternalAIRecommendationRequest,
    InternalAIRequest,
    InternalAIResponse,
} from '../types/dto/ai_service/internalAIService.js';
import type {
    HaircutRecommendationRequest,
    HaircutRecommendationResponse,
    HaircutStyleDTO,
    RecommendationHealthResponse,
} from '../types/dto/recommendation.interface.js';
import type { HaircutStyle } from '../types/entities/haircutStyle.interface.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { getUserPhotoKey } from '../utils/photoKey.js';
import { getClientByUserId, updateClientFacialStructure } from '../repositories/clientRepository.js';
import { getActiveHaircutStyles, getActiveHaircutStylesByFacialStructure } from '../repositories/haircutRepository.js';
import { calculateAge } from './userService.js';

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
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Network error. Could not call AI microservice');
    }

    if (!res.ok) {
        const errorMsg = `Request to AI microservice failed with status code: ${res.status}`;
        console.error(errorMsg);
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, errorMsg);
    }

    return (await res.json()) as RecommendationHealthResponse;
};

/**
 * Función auxiliar para llamar al microservicio de Python y detectar la estructura facial usando la IA.
 */
export const detectFacialStructure = async (photoKey: string): Promise<InternalAIResponse<InternalAIFaceDetectionResponse>> => {
    let res: Response;

    const payload = buildAIServicePayload<InternalAIFaceDetectionRequest>({ obj: { photoKey }, includeProvider: false });

    try {
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
        throw new ApiError(
            ApiErrorCode.INTERNAL_SERVER_ERROR,
            'Network error. Could not call AI facial detection microservice'
        );
    }

    if (!res.ok) {
        throw await buildAIServiceError(res, 'Facial detection request');
    }

    return (await res.json()) as InternalAIResponse<InternalAIFaceDetectionResponse>;
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

    const photoKey = getUserPhotoKey(performer.id);

    if (!client.facial_structure_type) {
        // Si el cliente no tiene una estructura facial registrada, llamamos a la IA para detectarla con la foto.
        const facialStructureResponse = await detectFacialStructure(photoKey);

        if (facialStructureResponse.data) {
            client.facial_structure_type = facialStructureResponse.data.facialStructure;
            
            // Se guarda para no volver a invocar a la IA en las siguientes recomendaciones.
            await updateClientFacialStructure(performer.id, client.facial_structure_type);

            console.log(
                chalk.green(
                    `[AI Service] Estructura facial detectada exitosamente por la IA: ${client.facial_structure_type}`
                )
            );
        } else {
            throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Facial detection request failed');
        }
    }

    console.log(
        chalk.green(
            `Estructura facial obtenida desde la base de datos: ${client.facial_structure_type}`
        )
    );

    const availableHaircuts =
        (await getActiveHaircutStylesByFacialStructure(client.facial_structure_type)) ??
        (await getActiveHaircutStyles());

    if (!availableHaircuts) {
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'No haircut styles were found');
    }

    const payload: InternalAIRecommendationRequest = {
        suggestedHaircuts: availableHaircuts.map(toHaircutStyleDTO),
        photoKey,
        userData: {
            age: calculateAge(user.birth_date),
            gender: user.gender,
            facialStructure: client.facial_structure_type,
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
            body: JSON.stringify(buildAIServicePayload({ obj: payload })),
        });
    } catch (error) {
        console.error(error);
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Network error. Could not call AI microservice');
    }

    if (!res.ok) {
        throw await buildAIServiceError(res, 'Haircut recommendation request');
    }

    return (await res.json()) as InternalAIResponse<HaircutRecommendationResponse>;
};

/** Solo se envían a la IA los campos que usa; `description` es nullable en la base de datos. */
const toHaircutStyleDTO = ({ id, name, description }: HaircutStyle): HaircutStyleDTO =>
    description ? { id, name, description } : { id, name };

/**
 * Traduce una respuesta de error del microservicio de IA a un ApiError.
 *
 * 400/422 significan que el contenido de la petición no se pudo procesar (p. ej. la foto no existe en el bucket
 * o no es una imagen válida), por lo que se devuelve como 400 al cliente con el detalle que reporta la IA.
 * Cualquier otro estado es una falla del servicio y se reporta como 500.
 */
const buildAIServiceError = async (res: Response, context: string): Promise<ApiError> => {
    const errorMsg = `${context} failed with status code: ${res.status}`;
    console.error(chalk.red(`\nERROR - ${errorMsg}`));

    let body: InternalAIResponse<unknown> | undefined;
    try {
        body = (await res.json()) as InternalAIResponse<unknown>;
    } catch {
        body = undefined;
    }
    console.error('Response from AI service:\n', body);

    if (res.status === 400 || res.status === 422) {
        const detail = body?.errors?.[0]?.detail ?? body?.message;
        return new ApiError(ApiErrorCode.BAD_REQUEST, detail ?? errorMsg, body?.errors);
    }

    return new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, errorMsg);
};

interface BuildAIServicePayloadProps<T> {
    obj: T;
    includeProvider?: boolean;
}

const buildAIServicePayload = <T>({
    obj,
    includeProvider = true,
}: BuildAIServicePayloadProps<T>): InternalAIRequest<T> => {
    return includeProvider
        ? {
            data: obj,
            provider: globalConfig.AI_PROVIDER,
        }
        : {
            data: obj,
        };
};
