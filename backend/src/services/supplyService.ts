import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    getAllSupplies,
    getSupplyById,
    getSupplyByNameAndShop,
    getSupplyBySkuAndShop,
    createSupply as repoCreateSupply,
    updateSupply as repoUpdateSupply,
    deleteSupply as repoDeleteSupply,
} from '../repositories/supplyRepository.js';
import { getShopById } from '../repositories/shopRepository.js';
import { getCategoryById } from '../repositories/suppliesCategoryRepository.js';
import { isUserActive } from '../repositories/userRepository.js';
import { decodeToken } from './jwtTokenService.js';
import { canManageSupplies } from './userPermissions.js';

/**
 * Recupera la lista de insumos.
 */
export const listSupplies = async (shopId?: string, token?: string) => {
    const performer = decodeToken(token!);

    if (!canManageSupplies(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to view supplies');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    return await getAllSupplies(shopId);
};

/**
 * Obtiene los detalles de un insumo específico.
 */
export const getSupply = async (id: string, token?: string) => {
    const performer = decodeToken(token!);

    if (!canManageSupplies(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to view supplies');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const supply = await getSupplyById(id);
    if (!supply) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Supply not found');
    }
    return supply;
};

/**
 * Registra un nuevo insumo.
 * Valida la existencia de la sucursal y la categoría, así como las restricciones de unicidad.
 */
export const registerSupply = async (data: any, token: string) => {
    const performer = decodeToken(token);

    if (!canManageSupplies(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to manage supplies');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    // Validar que la sucursal existe
    const shop = await getShopById(data.shopId);
    if (!shop) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');

    // Validar que la categoría existe
    const category = await getCategoryById(data.categoryId);
    if (!category) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');

    // Validar que el nombre no esté duplicado en esta sucursal
    const nameExists = await getSupplyByNameAndShop(data.name, data.shopId);
    if (nameExists) throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Supply name is already in use in this shop');

    // Validar que el SKU no esté duplicado en esta sucursal (si se envió uno)
    if (data.sku) {
        const skuExists = await getSupplyBySkuAndShop(data.sku, data.shopId);
        if (skuExists) throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'SKU is already in use in this shop');
    }

    return await repoCreateSupply(data);
};

/**
 * Edita un insumo existente.
 * Valida las llaves foráneas y reglas de unicidad en caso de que dichos campos cambien.
 */
export const editSupply = async (id: string, data: any, token: string) => {
    const performer = decodeToken(token);

    if (!canManageSupplies(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to manage supplies');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const supply = await getSupplyById(id);
    if (!supply) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Supply not found');

    const targetShopId = data.shopId || supply.shop_id;

    // Si cambian la sucursal, validar que la nueva exista
    if (data.shopId && data.shopId !== supply.shop_id) {
        const shop = await getShopById(data.shopId);
        if (!shop) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
    }

    // Si cambian la categoría, validar que la nueva exista
    if (data.categoryId && data.categoryId !== supply.category_id) {
        const category = await getCategoryById(data.categoryId);
        if (!category) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }

    // Validar duplicado de nombre (solo si cambia el nombre o la sucursal)
    if ((data.name && data.name.toLowerCase() !== supply.name.toLowerCase()) || data.shopId) {
        const nameToCheck = data.name || supply.name;
        const nameExists = await getSupplyByNameAndShop(nameToCheck, targetShopId);
        if (nameExists && nameExists.id !== id) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Supply name is already in use in this shop');
        }
    }

    // Validar duplicado de SKU (solo si cambia el SKU o la sucursal)
    if ((data.sku && data.sku !== supply.sku) || (data.shopId && supply.sku)) {
        const skuToCheck = data.sku !== undefined ? data.sku : supply.sku;
        if (skuToCheck) {
            const skuExists = await getSupplyBySkuAndShop(skuToCheck, targetShopId);
            if (skuExists && skuExists.id !== id) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'SKU is already in use in this shop');
            }
        }
    }

    return await repoUpdateSupply(id, data);
};

/**
 * Elimina físicamente un insumo.
 */
export const removeSupply = async (id: string, token: string): Promise<void> => {
    const performer = decodeToken(token);

    if (!canManageSupplies(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to delete supplies');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    await repoDeleteSupply(id);
};