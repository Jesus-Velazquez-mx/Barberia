import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getClientByUserId } from '../repositories/clientRepository.js';
import {
    getRecommendationHistoryByClientId,
    type RecommendationHistoryWithHaircuts,
} from '../repositories/recommendationHistoryRepository.js';
import type {
    RecommendationHistoryEntryDTO,
    RecommendationHistoryStatus,
} from '../types/dto/recommendation.interface.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { canViewRecommendationHistory } from './userPermissions.js';

/**
 * Devuelve el historial de recomendaciones de un cliente, de la más reciente a la más antigua.
 * Un cliente solo puede consultar el suyo; la recepción y los gerentes pueden consultar el de cualquiera.
 */
export const getRecommendationHistory = async (
    clientId: string,
    token: string
): Promise<RecommendationHistoryEntryDTO[]> => {
    const performer = await isUserSessionValid(token);

    if (!canViewRecommendationHistory(performer, clientId)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, "You are not allowed to view this client's recommendation history");
    }

    if (!(await getClientByUserId(clientId))) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client could not be found');
    }

    const history = await getRecommendationHistoryByClientId(clientId);
    return history.map(toHistoryEntryDTO);
};

/** Las filas fallidas ya vienen excluidas, así que la ausencia de sugerencia significa que ningún corte aplicó. */
const toStatus = (row: RecommendationHistoryWithHaircuts): RecommendationHistoryStatus =>
    row.suggestion_text !== null ? 'recommended' : 'no_suitable_haircut';

const toHistoryEntryDTO = (row: RecommendationHistoryWithHaircuts): RecommendationHistoryEntryDTO => ({
    id: row.id,
    status: toStatus(row),
    suggestionText: row.suggestion_text,
    // pg devuelve las columnas numeric como string.
    confidence: row.confidence === null ? null : Number(row.confidence),
    reasoning: row.reasoning,
    recommendedHaircuts: row.recommended_haircuts,
    requestedAt: row.requested_at,
    completedAt: row.completed_at,
});
