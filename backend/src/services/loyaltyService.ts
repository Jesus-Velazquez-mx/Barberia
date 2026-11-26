import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getLoyaltyState } from '../repositories/clientRepository.js';
import type { LoyaltyStatusResponse } from '../types/dto/clientResponse.interface.js';
import { evaluateReward, LOYALTY_REWARD_THRESHOLD } from '../utils/loyalty.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { canViewClientLoyalty } from './userPermissions.js';

export { evaluateReward, LOYALTY_REWARD_THRESHOLD };

/**
 * Construye el estado de lealtad completo de un cliente a partir de su lectura sin candado.
 */
export const getLoyaltyStatus = async (clientId: string, token?: string): Promise<LoyaltyStatusResponse> => {
    if (token !== undefined) {
        const actor = await isUserSessionValid(token);
        if (!canViewClientLoyalty({ id: actor.id, role: actor.role }, clientId)) {
            throw new ApiError(ApiErrorCode.FORBIDDEN, 'You do not have permission to view this client loyalty status');
        }
    }

    const loyaltyState = await getLoyaltyState(clientId);
    if (!loyaltyState) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client not found');
    }

    const { rewardAvailable, rewardAppliesOnNextBooking } = evaluateReward(
        loyaltyState.completedServicesCount,
        loyaltyState.hasOpenRewardAppointment
    );

    return {
        completedServicesCount: loyaltyState.completedServicesCount,
        threshold: LOYALTY_REWARD_THRESHOLD,
        appointmentsUntilReward: Math.max(0, LOYALTY_REWARD_THRESHOLD - loyaltyState.completedServicesCount),
        rewardAvailable,
        hasOpenRewardAppointment: loyaltyState.hasOpenRewardAppointment,
        rewardAppliesOnNextBooking,
    };
};
