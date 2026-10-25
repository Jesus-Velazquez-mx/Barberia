import chalk from 'chalk';
import globalConfig from '../config/globalConfig.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getUserById } from '../repositories/userRepository.js';
import type {
    InternalAIFaceDetectionRequest,
    InternalAIFaceDetectionResponse,
    InternalAIRecommendationRequest,
    InternalAIRecommendationResponse,
    InternalAIRequest,
    InternalAIResponse,
} from '../types/dto/ai_service/internalAIService.js';
import type {
    HaircutRecommendationRequest,
    HaircutRecommendationResult,
    HaircutStyleDTO,
    RecommendationHealthResponse,
} from '../types/dto/recommendation.interface.js';
import type { HaircutStyle } from '../types/entities/haircutStyle.interface.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { getUserPhotoKey } from '../utils/photoKey.js';
import { getClientByUserId, updateClientFacialStructure } from '../repositories/clientRepository.js';
import { getActiveHaircutStyles, getActiveHaircutStylesByFacialStructure } from '../repositories/haircutRepository.js';
import {
    createRecommendationHistory,
    type CreateRecommendationHistoryParams,
} from '../repositories/recommendationHistoryRepository.js';
import type { Client } from '../types/entities/client.interface.js';
import type { User } from '../types/entities/user.interface.js';
import { calculateAge } from './userService.js';

/** Plantilla fija que se envía al cliente cuando el LLM descarta todos los cortes; el motivo va aparte en `data.reason`. */
export const NO_SUITABLE_HAIRCUT_MESSAGE =
    'Ninguno de los cortes existentes parece ajustarse a tus preferencias, te sugerimos hablar directamente con tu barbero';

export const RECOMMENDATION_GENERATED_MESSAGE = 'Recomendación de corte generada exitosamente';

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
export const detectFacialStructure = async (
    photoKey: string
): Promise<InternalAIResponse<InternalAIFaceDetectionResponse>> => {
    let res: Response;

    const payload = buildAIServicePayload<InternalAIFaceDetectionRequest>({
        obj: { photoKey },
        includeProvider: false,
    });

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
): Promise<HaircutRecommendationResult> => {
    const performer = await isUserSessionValid(token);

    if (performer.role !== 'client') {
        throw new ApiError(ApiErrorCode.UNAUTHORIZED, 'This feature is only available for clients');
    }

    const user = await getUserById(performer.id);
    const client = await getClientByUserId(performer.id);

    if (!client || !user) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client could not be found');
    }

    const requestedAt = new Date();
    let recommendationResult: HaircutRecommendationResult;

    try {
        recommendationResult = await requestRecommendation(user, client, recommendationParams);
    } catch (error) {
        await saveRecommendationHistory({
            clientId: client.user_id,
            errorMessage: error instanceof Error ? error.message : String(error),
            requestedAt,
        });
        throw error;
    }

    await saveRecommendationHistory({
        clientId: client.user_id,
        requestedAt,
        ...toHistoryFields(recommendationResult),
    });

    return recommendationResult;
};

/**
 * Obtiene la recomendación llamando a la IA (y detectando antes la estructura facial si el cliente aún no la tiene).
 */
const requestRecommendation = async (
    user: User,
    client: Client,
    recommendationParams: HaircutRecommendationRequest
): Promise<HaircutRecommendationResult> => {
    let res: Response;

    const photoKey = getUserPhotoKey(client.user_id);

    if (!client.facial_structure_type) {
        // Si el cliente no tiene una estructura facial registrada, llamamos a la IA para detectarla con la foto.
        const facialStructureResponse = await detectFacialStructure(photoKey);

        if (facialStructureResponse.data) {
            client.facial_structure_type = facialStructureResponse.data.facialStructure;

            // Se guarda para no volver a invocar a la IA en las siguientes recomendaciones.
            await updateClientFacialStructure(client.user_id, client.facial_structure_type);

            console.log(
                chalk.green(
                    `[AI Service] Estructura facial detectada exitosamente por la IA: ${client.facial_structure_type}`
                )
            );
        } else {
            throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Facial detection request failed');
        }
    }

    console.log(chalk.green(`Estructura facial obtenida desde la base de datos: ${client.facial_structure_type}`));

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

    const aiResponse = (await res.json()) as InternalAIResponse<InternalAIRecommendationResponse>;
    return toRecommendationResult(aiResponse.data);
};

type HistoryResultFields = Pick<
    CreateRecommendationHistoryParams,
    'suggestionText' | 'confidence' | 'reasoning' | 'recommendedHaircutStyleId'
>;

/** Campos del historial que corresponden a un resultado de la IA (recomendación o "ningún corte aplica"). */
const toHistoryFields = ({ data }: HaircutRecommendationResult): HistoryResultFields => {
    if (data.status === 'no_suitable_haircut') {
        return { reasoning: data.reason };
    }

    return {
        suggestionText: data.suggestionText,
        // La IA reporta la confianza entre 0 y 1, pero la tabla la guarda como porcentaje.
        confidence: Math.round(data.confidence * 10000) / 100,
        reasoning: data.reasoning,
        // Si la IA sugiere varios cortes, el historial solo conserva el primero.
        recommendedHaircutStyleId: data.haircuts[0]?.id ?? null,
    };
};

/**
 * Guarda el resultado en el historial. Un fallo al guardar solo se registra en el log: no debe tumbar la solicitud
 * (ni ocultar el error original de la IA cuando se está guardando un fallo).
 */
const saveRecommendationHistory = async (
    params: Omit<CreateRecommendationHistoryParams, 'completedAt'>
): Promise<void> => {
    try {
        await createRecommendationHistory({ ...params, completedAt: new Date() });
    } catch (error) {
        console.error(chalk.red('\nERROR - Could not save the recommendation to the history:'), error);
    }
};

/**
 * Convierte la respuesta de la IA en lo que se envía al cliente web. Cuando el LLM considera que ningún corte
 * encaja con las preferencias, el mensaje es una plantilla fija y solo el motivo (`reason`) lo redacta el LLM.
 */
const toRecommendationResult = (data: InternalAIRecommendationResponse | undefined): HaircutRecommendationResult => {
    if (!data) {
        console.error(chalk.red('\nERROR - AI service returned a successful response without data'));
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Haircut recommendation request returned no data');
    }

    if (data.status === 'no_suitable_haircut') {
        return {
            message: NO_SUITABLE_HAIRCUT_MESSAGE,
            data: { status: 'no_suitable_haircut', reason: data.reasoning },
        };
    }

    if (data.suggestionText === undefined || data.confidence === undefined) {
        console.error(chalk.red('\nERROR - AI service returned an incomplete recommendation:'), data);
        throw new ApiError(
            ApiErrorCode.INTERNAL_SERVER_ERROR,
            'Haircut recommendation request returned incomplete data'
        );
    }

    return {
        message: RECOMMENDATION_GENERATED_MESSAGE,
        data: {
            status: 'recommended',
            haircuts: data.haircuts,
            suggestionText: data.suggestionText,
            reasoning: data.reasoning,
            confidence: data.confidence,
        },
    };
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
