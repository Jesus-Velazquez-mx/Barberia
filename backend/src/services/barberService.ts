import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import { canUpdateBarberProfile, canDeleteBarber } from './userPermissions.js';
import { getBarberById, updateBarberProfileById, softDeleteBarberById } from '../repositories/barberRepository.js';
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
        id: target.id,
        bio: target.bio,
        isAcceptingBookings: target.isAcceptingBookings
    });

    return toBarberResponse(updated);
};

/**
 * Da de baja lógicamente al barbero objetivo, siempre que el usuario autenticado
 * por el token esté autorizado a hacerlo (ver userPermissions.ts). Los barberos no
 * tienen cuenta de usuario ni token propio, así que esta acción siempre la realiza
 * un tercero (un manager).
 */
const deleteBarber = async (targetId: string, token: string): Promise<void> => {
    const performer = decodeToken(token);

    if (!canDeleteBarber(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to delete this barber');
    }

    const barber = await getBarberById(targetId);
    if (!barber) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }

    await softDeleteBarberById(targetId);
};

export { updateBarber, deleteBarber };
