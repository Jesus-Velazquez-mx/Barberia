import bcrypt from 'bcrypt';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import {
    getReceptionistWithUserById,
    getReceptionistsByShop,
    createReceptionist,
    reactivateReceptionist,
    type CreateReceptionistInput,
} from '../repositories/receptionistRepository.js';
import { getUserByEmail, isUserActive, softDeleteStaff, updateUserById } from '../repositories/userRepository.js';
import { getShopById, getShopIdsByManagerId } from '../repositories/shopRepository.js';
import { getShiftById } from '../repositories/shiftRepository.js';
import type { ReceptionistDetailResponse } from '../types/dto/receptionistResponse.interface.js';
import { toReceptionistDetailResponse } from '../utils/receptionistMapper.js';
import { canManageReceptionists, canManageShopReceptionists } from './userPermissions.js';

export interface RegisterReceptionistInput {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    birthDate: Date;
    gender: string;
    password: string;
    shopId: string;
    shiftId: string;
}

export interface UpdateReceptionistInput {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthDate?: Date;
    gender?: string;
}

/**
 * Valida que quien ejecuta la acción sea un gerente activo y devuelve los IDs de las sucursales que administra.
 * Un gerente solo puede gestionar a los recepcionistas de esas sucursales.
 */
const authorizeManager = async (token: string, forbiddenMessage: string): Promise<string[]> => {
    const performer = decodeToken(token);

    if (!canManageReceptionists(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, forbiddenMessage);
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    return getShopIdsByManagerId(performer.id);
};

const assertShopManaged = (shopId: string, managedShopIds: string[]): void => {
    if (!canManageShopReceptionists(shopId, managedShopIds)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to manage receptionists of this shop');
    }
};

/**
 * Obtiene el detalle de un recepcionista (incluso dado de baja) de una sucursal que administra el gerente.
 */
export const getReceptionistDetails = async (id: string, token: string): Promise<ReceptionistDetailResponse> => {
    const managedShopIds = await authorizeManager(token, 'Not authorized to view this receptionist');

    const receptionist = await getReceptionistWithUserById(id);
    if (!receptionist) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Receptionist not found');
    }
    assertShopManaged(receptionist.shop_id, managedShopIds);

    return toReceptionistDetailResponse(receptionist);
};

/**
 * Lista los recepcionistas de una sucursal que administra el gerente. Por defecto excluye a los dados de baja;
 * con includeInactive también los incluye. Una sucursal sin recepcionistas devuelve un arreglo vacío.
 */
export const listReceptionistsByShop = async (
    shopId: string,
    token: string,
    includeInactive = false
): Promise<ReceptionistDetailResponse[]> => {
    const managedShopIds = await authorizeManager(token, 'Not authorized to view receptionists');

    const shop = await getShopById(shopId);
    if (!shop) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
    }
    assertShopManaged(shopId, managedShopIds);

    const receptionists = await getReceptionistsByShop(shopId, includeInactive);
    return receptionists.map(toReceptionistDetailResponse);
};

/**
 * Registra un nuevo recepcionista o reactiva uno dado de baja si el correo coincide.
 */
export const registerReceptionist = async (
    data: RegisterReceptionistInput,
    token: string
): Promise<ReceptionistDetailResponse> => {
    const managedShopIds = await authorizeManager(token, 'Not authorized to create a receptionist');

    const shop = await getShopById(data.shopId);
    if (!shop) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');

    const shift = await getShiftById(data.shiftId);
    if (!shift) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shift not found');

    assertShopManaged(data.shopId, managedShopIds);

    const input: CreateReceptionistInput = {
        email: data.email,
        phone: data.phone ?? null,
        passwordHash: await bcrypt.hash(data.password, 10),
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        gender: data.gender,
        shopId: data.shopId,
        shiftId: data.shiftId,
    };

    // El correo es único en toda la tabla users: solo un recepcionista dado de baja puede reactivarse con él.
    const existingUser = await getUserByEmail(data.email);

    if (existingUser) {
        if (existingUser.role !== 'receptionist') {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email is already registered');
        }

        const existingReceptionist = await getReceptionistWithUserById(existingUser.id);
        if (existingReceptionist && existingReceptionist.deleted_at === null) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email already in use by an active receptionist');
        }

        const reactivated = await reactivateReceptionist(existingUser.id, input);
        return toReceptionistDetailResponse(reactivated);
    }

    const created = await createReceptionist(input);
    return toReceptionistDetailResponse(created);
};

/**
 * Actualiza los datos personales del recepcionista objetivo. La sucursal y el turno no se modifican aquí.
 */
export const updateReceptionist = async (
    target: UpdateReceptionistInput,
    token: string
): Promise<ReceptionistDetailResponse> => {
    const managedShopIds = await authorizeManager(token, 'Not authorized to update this receptionist');

    const receptionist = await getReceptionistWithUserById(target.id);
    if (!receptionist) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Receptionist not found');
    }
    assertShopManaged(receptionist.shop_id, managedShopIds);

    if (receptionist.deleted_at !== null) {
        throw new ApiError(
            ApiErrorCode.CONFLICT,
            'Receptionist has been deleted. Reactivation is needed to modify receptionist data'
        );
    }

    // updateUserById valida que correo y teléfono no pertenezcan a otro usuario (409)
    await updateUserById({
        id: target.id,
        firstName: target.firstName,
        lastName: target.lastName,
        email: target.email,
        phone: target.phone,
        birthDate: target.birthDate,
        gender: target.gender,
    });

    const updated = await getReceptionistWithUserById(target.id);
    if (!updated) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Receptionist not found');
    }
    return toReceptionistDetailResponse(updated);
};

/**
 * Da de baja lógicamente al recepcionista objetivo.
 */
export const deleteReceptionist = async (targetId: string, token: string): Promise<void> => {
    const managedShopIds = await authorizeManager(token, 'Not authorized to delete this receptionist');

    const receptionist = await getReceptionistWithUserById(targetId);
    if (!receptionist) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Receptionist not found');
    }
    assertShopManaged(receptionist.shop_id, managedShopIds);

    // Ya dado de baja: no-op, para no sobrescribir la fecha original de deleted_at (igual que deleteBarber)
    if (receptionist.deleted_at !== null) return;

    await softDeleteStaff(targetId, 'receptionist');
};
