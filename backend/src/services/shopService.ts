import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    getActiveShops,
    getAllShops,
    getShopById,
    getShopByName,
    createShop as repoCreateShop,
    updateShop as repoUpdateShop,
    softDeleteShop as repoSoftDeleteShop,
} from '../repositories/shopRepository.js';
import { getManagerByUserId } from '../repositories/managerRepository.js';
import { isUserActive } from '../repositories/userRepository.js';
import { decodeToken } from './jwtTokenService.js';
import { canManageShops } from './userPermissions.js';
import type { ShopResponse } from '../types/dto/shopResponse.interface.js';
import type { CreateShopRequest, UpdateShopRequest } from '../types/dto/shopRequest.interface.js';
import { toShopResponse } from '../utils/shopMapper.js';

export const listActiveShops = async (): Promise<ShopResponse[]> => {
    const shops = await getActiveShops();
    return shops.map(toShopResponse);
};

export const listShops = async (includeInactive = false): Promise<ShopResponse[]> => {
    const shops = includeInactive ? await getAllShops() : await getActiveShops();
    return shops.map(toShopResponse);
};

export const getActiveShopById = async (id: string): Promise<ShopResponse> => {
    const shop = await getShopById(id);

    // Si no existe o está inactiva, devolvemos 404 ya que no debe ser agendable
    if (!shop || !shop.is_active) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found or is inactive');
    }

    return toShopResponse(shop);
};

/**
 * Registra una nueva sucursal.
 * Requiere rol de manager y cuenta activa.
 */
export const registerShop = async (data: CreateShopRequest, token: string): Promise<ShopResponse> => {
    const performer = decodeToken(token);

    if (!canManageShops(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to create shops');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const targetManagerId = data.managerId ?? performer.id;

    // Verificar que el manager asignado exista y esté activo
    const manager = await getManagerByUserId(targetManagerId);
    if (!manager || manager.deleted_at !== null) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Manager not found or is deactivated');
    }

    // Verificar unicidad de nombre de sucursal
    const existing = await getShopByName(data.name);
    if (existing) {
        throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Shop name is already in use');
    }

    const createdShop = await repoCreateShop({
        ...data,
        managerId: targetManagerId,
    });

    return toShopResponse(createdShop);
};

/**
 * Edita la información de una sucursal existente.
 * Requiere rol de manager y cuenta activa.
 */
export const editShop = async (id: string, data: UpdateShopRequest, token: string): Promise<ShopResponse> => {
    const performer = decodeToken(token);

    if (!canManageShops(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to update shops');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const shop = await getShopById(id);
    if (!shop) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
    }

    // Si cambia el nombre, validar que no colisione con otra sucursal
    if (data.name && data.name.toLowerCase() !== shop.name.toLowerCase()) {
        const existing = await getShopByName(data.name);
        if (existing && existing.id !== id) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Shop name is already in use');
        }
    }

    // Si cambia el manager, validar que exista y esté activo
    if (data.managerId) {
        const manager = await getManagerByUserId(data.managerId);
        if (!manager || manager.deleted_at !== null) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Manager not found or is deactivated');
        }
    }

    const updatedShop = await repoUpdateShop(id, data);
    return toShopResponse(updatedShop);
};

/**
 * Elimina lógicamente una sucursal.
 * Realiza un borrado lógico marcando is_active = false.
 */
export const removeShop = async (id: string, token: string): Promise<void> => {
    const performer = decodeToken(token);

    if (!canManageShops(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to delete shops');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const shop = await getShopById(id);
    if (!shop) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
    }

    await repoSoftDeleteShop(id);
};
