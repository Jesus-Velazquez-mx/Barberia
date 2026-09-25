import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import { canUpdateBarberProfile } from './userPermissions.js';
import { updateBarberProfileById } from '../repositories/barberRepository.js';
import type { BarberResponse } from '../types/dto/barberResponse.interface.js';
import { toBarberResponse } from '../utils/userMapper.js';

export interface UpdateBarberRequest {
    id: string;
    bio?: string;
    isAcceptingBookings?: boolean;
}

/**
 * Actualiza el perfil del barbero objetivo, siempre que el usuario autenticado por
 * el token esté autorizado a hacerlo (ver userPermissions.ts).
 */
const updateBarber = async (target: UpdateBarberRequest, token: string): Promise<BarberResponse> => {
    const performer = decodeToken(token);

    if (!canUpdateBarberProfile(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to update this barber');
    }

    const updated = await updateBarberProfileById({
        userId: target.id,
        bio: target.bio,
        isAcceptingBookings: target.isAcceptingBookings
    });

    return toBarberResponse(updated);
};

export { updateBarber };
