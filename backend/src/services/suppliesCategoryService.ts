import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    getAllCategories,
    getCategoryById,
    getCategoryByName,
    createCategory as repoCreateCategory,
    updateCategory as repoUpdateCategory,
    deleteCategory as repoDeleteCategory,
} from '../repositories/suppliesCategoryRepository.js';
import { isUserActive } from '../repositories/userRepository.js';
import { decodeToken } from './jwtTokenService.js';
import { canManageSuppliesCategories } from '../services/userPermissions.js';

/**
 * Recupera la lista completa de categorías de insumos.
 * Requiere rol de manager y cuenta activa.
 */
export const listCategories = async (token: string) => {
    const performer = decodeToken(token);

    if (!canManageSuppliesCategories(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to view categories');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    return await getAllCategories();
};

/**
 * Obtiene los detalles de una categoría por su ID.
 * Requiere rol de manager y cuenta activa.
 * Lanza un error 404 si la categoría no existe.
 */
export const getCategory = async (id: string, token: string) => {
    const performer = decodeToken(token);

    if (!canManageSuppliesCategories(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to view categories');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const category = await getCategoryById(id);
    if (!category) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }
    return category;
};

/**
 * Registra una nueva categoría de insumos.
 * Requiere rol de manager y cuenta activa.
 * Valida que el nombre de la categoría no esté en uso.
 */
export const registerCategory = async (data: { name: string; description?: string | null }, token: string) => {
    const performer = decodeToken(token);

    if (!canManageSuppliesCategories(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to create categories');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    // Verificar unicidad de nombre de categoría
    const existing = await getCategoryByName(data.name);
    if (existing) {
        throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Category name is already in use');
    }

    return await repoCreateCategory(data);
};

/**
 * Edita la información de una categoría existente.
 * Requiere rol de manager y cuenta activa.
 * Valida que el nuevo nombre no colisione con otra categoría.
 */
export const editCategory = async (id: string, data: { name?: string; description?: string | null }, token: string) => {
    const performer = decodeToken(token);

    if (!canManageSuppliesCategories(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to update categories');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const category = await getCategoryById(id);
    if (!category) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }

    // Si cambia el nombre, validar que no colisione con otra categoría diferente
    if (data.name && data.name.toLowerCase() !== category.name.toLowerCase()) {
        const existing = await getCategoryByName(data.name);
        if (existing && existing.id !== id) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Category name is already in use');
        }
    }

    return await repoUpdateCategory(id, data);
};

/**
 * Elimina físicamente una categoría de insumos.
 * Requiere rol de manager y cuenta activa.
 * Traduce el error de base de datos (ON DELETE RESTRICT) si la categoría está en uso por insumos.
 */
export const removeCategory = async (id: string, token: string): Promise<void> => {
    const performer = decodeToken(token);

    if (!canManageSuppliesCategories(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to delete categories');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const category = await getCategoryById(id);
    if (!category) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }

    try {
        await repoDeleteCategory(id);
    } catch (error: unknown) {
        // Códigos PostgreSQL para violación de integridad referencial:
        // 23503 (foreign_key_violation) y 23001 (restrict_violation)
        const dbError = error as { code?: string };
        if (dbError.code === '23503' || dbError.code === '23001') { 
            throw new ApiError(ApiErrorCode.BAD_REQUEST, 'Cannot delete category because it has supplies assigned');
        }
        throw error;
    }
};