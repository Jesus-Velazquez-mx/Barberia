import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import {
    getBarberById,
    getBarberByEmail,
    getBarberByPhone,
    createBarber as repoCreateBarber,
    reactivateBarber,
    updateBarberProfileById,
    softDeleteBarberById,
    getActiveBarbersByShop,
    getBarbersByShop,
    type CreateBarberInput
} from '../repositories/barberRepository.js';
import { isUserActive } from '../repositories/userRepository.js';
import { getShopById } from '../repositories/shopRepository.js';
import type { BarberResponse, PublicBarberResponse } from '../types/dto/barberResponse.interface.js';
import { toBarberResponse, toPublicBarberResponse } from '../utils/barberMapper.js';
import { canViewFullBarberData } from './userPermissions.js';

export interface UpdateBarberRequest {
    id: string;
    bio?: string;
    isAcceptingBookings?: boolean;
}

/**
 * Obtiene el detalle de un barbero por su ID. El personal recibe el perfil completo de cualquier
 * barbero; los clientes solo la vista pública y únicamente de barberos activos que aceptan reservas.
 */
export const getBarberDetails = async (id: string, token: string): Promise<BarberResponse | PublicBarberResponse> => {
    const performer = decodeToken(token);

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const barber = await getBarberById(id);
    if (!barber) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }

    if (canViewFullBarberData(performer)) {
        return toBarberResponse(barber);
    }

    if (barber.deleted_at !== null || !barber.is_accepting_bookings) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }
    return toPublicBarberResponse(barber);
};

/**
 * Obtiene los barberos de una sucursal. Endpoint público: sin token (o con token de cliente) devuelve
 * la vista pública de los barberos activos que aceptan reservas. El personal recibe el perfil completo
 * de los barberos no dados de baja, o también los dados de baja si includeInactive es true; para los
 * demás usuarios includeInactive se ignora.
 */
export const listBarbersByShop = async (
    shopId: string,
    token: string | undefined,
    includeInactive = false
): Promise<BarberResponse[] | PublicBarberResponse[]> => {
    const performer = token ? decodeToken(token) : null;

    if (performer && !(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const shop = await getShopById(shopId);
    if (!shop) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
    }

    if (performer && canViewFullBarberData(performer)) {
        const barbers = await getBarbersByShop(shopId, includeInactive);
        return barbers.map(toBarberResponse);
    }

    const barbers = await getActiveBarbersByShop(shopId);
    return barbers.map(toPublicBarberResponse);
};

/**
 * Registra un nuevo barbero en el sistema o reactiva uno dado de baja si el correo coincide.
 */
export const registerBarber = async (data: CreateBarberInput, token: string): Promise<BarberResponse> => {
    const performer = decodeToken(token);

    // Validación estricta de permisos: Solo un manager puede insertar barberos
    if (performer.role !== 'manager') {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to create a barber');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    // Validar que la sucursal asignada exista
    const shop = await getShopById(data.shopId);
    if (!shop) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');

    // 1. Verificamos duplicidad de Email y aplicamos regla de Reactivación
    const existingByEmail = await getBarberByEmail(data.email);
    
    if (existingByEmail) {
        if (existingByEmail.deleted_at === null) {
            // Si el correo existe y el barbero está ACTIVO, rechazamos la creación.
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email already in use by an active barber');
        } else {
            // Si el correo existe pero está INACTIVO, lo reactivamos.
            
            // Antes de reactivarlo, revisamos si proporcionó un teléfono y si este choca con OTRO barbero.
            if (data.phone) {
                const existingByPhone = await getBarberByPhone(data.phone);
                // Si el teléfono existe y no le pertenece al barbero que estamos reactivando, marcamos error.
                if (existingByPhone && existingByPhone.id !== existingByEmail.id) {
                    throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Phone number already in use by another barber');
                }
            }

            // Realizamos la reactivación (Update total y limpiamos deleted_at)
            const reactivatedBarber = await reactivateBarber(existingByEmail.id, data);
            return toBarberResponse(reactivatedBarber);
        }
    }

    // 2. Si el email es totalmente nuevo, verificamos que el teléfono no exista.
    if (data.phone) {
        const existingByPhone = await getBarberByPhone(data.phone);
        if (existingByPhone) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Phone number already in use');
        }
    }

    // 3. Inserción normal de un barbero nuevo
    const newBarber = await repoCreateBarber(data);
    return toBarberResponse(newBarber);
};

/**
 * Actualiza el perfil del barbero objetivo.
 */
export const updateBarber = async (target: UpdateBarberRequest, token: string): Promise<BarberResponse> => {
    const performer = decodeToken(token);

    if (performer.role !== 'manager') {
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
 * Da de baja lógicamente al barbero objetivo.
 */
export const deleteBarber = async (targetId: string, token: string): Promise<void> => {
    const performer = decodeToken(token);

    if (performer.role !== 'manager') {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to delete this barber');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const barber = await getBarberById(targetId);
    if (!barber) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }

    await softDeleteBarberById(targetId);
};