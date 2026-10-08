import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import { canUpdateBarberProfile, canDeleteBarber } from './userPermissions.js';
import {
    getBarberById,
    updateBarberProfileById,
    softDeleteBarberById,
    getActiveBarbersByShop,
} from '../repositories/barberRepository.js';
import { isUserActive } from '../repositories/userRepository.js';
import { getShopById } from '../repositories/shopRepository.js';
import type { BarberResponse } from '../types/dto/barberResponse.interface.js';
import { toBarberResponse } from '../utils/barberMapper.js';

export interface UpdateBarberRequest {
    id: string;
    bio?: string;
    isAcceptingBookings?: boolean;
}

/**
 * Actualiza el perfil del barbero objetivo, siempre que el usuario autenticado por
 * el token esté autorizado a hacerlo (ver userPermissions.ts) y su cuenta siga activa.
 */
const updateBarber = async (target: UpdateBarberRequest, token: string): Promise<BarberResponse> => {
    const performer = decodeToken(token);

    if (!canUpdateBarberProfile(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to update this barber');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const updated = await updateBarberProfileById({
        id: target.id,
        bio: target.bio,
        isAcceptingBookings: target.isAcceptingBookings,
    });

    return toBarberResponse(updated);
};

/**
 * Da de baja lógicamente al barbero objetivo, siempre que el usuario autenticado
 * por el token esté autorizado a hacerlo (ver userPermissions.ts) y su cuenta siga
 * activa. Los barberos no tienen cuenta de usuario ni token propio, así que esta
 * acción siempre la realiza un tercero (un manager).
 */
const deleteBarber = async (targetId: string, token: string): Promise<void> => {
    const performer = decodeToken(token);

    if (!canDeleteBarber(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to delete this barber');
    }

    // Rechaza un token que aún es válido cuyo propietario fue desactivado desde que fue emitido.
    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const barber = await getBarberById(targetId);
    if (!barber) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }

    await softDeleteBarberById(targetId);
};

const listActiveBarbersByShop = async (shopId: string) => {
    // 1. Verificamos que la sucursal exista
    const shop = await getShopById(shopId);
    if (!shop) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
    }

    // 2. Traemos los barberos elegibles de esa sucursal
    const barbers = await getActiveBarbersByShop(shopId);
    return barbers.map(toBarberResponse);
};

export { updateBarber, deleteBarber, listActiveBarbersByShop };
