import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    getAllCategories,
    getCategoryById,
    getCategoryByName,
    createCategory as repoCreateCategory,
    updateCategory as repoUpdateCategory,
    deleteCategory as repoDeleteCategory,
} from '../repositories/serviceCategoryRepository.js';
import { isUserActive } from '../repositories/userRepository.js';
import { decodeToken } from './jwtTokenService.js';
import { canManageServiceCategories } from './userPermissions.js';

/**
 * Recupera el listado completo de categorías de servicios disponibles en el sistema.
 * Requiere rol de manager y cuenta de usuario activa.
 */
export const listCategories = async (token: string) => {
    const performer = decodeToken(token);

    if (!canManageServiceCategories(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to view categories');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    return await getAllCategories();
};

/**
 * Obtiene los detalles de una categoría de servicios por su identificador único.
 * Requiere rol de manager y cuenta de usuario activa.
 */
export const getCategory = async (id: string, token: string) => {
    const performer = decodeToken(token);

    if (!canManageServiceCategories(performer)) {
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
 * Registra una nueva categoría de servicios en el catálogo.
 * Requiere rol de manager y cuenta de usuario activa.
 * Valida que el nombre de la categoría no esté duplicado.
 */
export const registerCategory = async (data: { name: string; description?: string | null }, token: string) => {
    const performer = decodeToken(token);

    if (!canManageServiceCategories(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to create categories');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const existing = await getCategoryByName(data.name);
    if (existing) {
        throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Category name is already in use');
    }

    return await repoCreateCategory(data);
};

/**
 * Actualiza los datos de una categoría de servicios existente.
 * Requiere rol de manager y cuenta de usuario activa.
 * Valida que el nuevo nombre no colisione con el de otra categoría existente.
 */
export const editCategory = async (id: string, data: { name?: string; description?: string | null }, token: string) => {
    const performer = decodeToken(token);

    if (!canManageServiceCategories(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to update categories');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const category = await getCategoryById(id);
    if (!category) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }

    if (data.name && data.name.toLowerCase() !== category.name.toLowerCase()) {
        const existing = await getCategoryByName(data.name);
        if (existing && existing.id !== id) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Category name is already in use');
        }
    }

    return await repoUpdateCategory(id, data);
};

/**
 * Elimina una categoría de servicios del catálogo.
 * Requiere rol de manager y cuenta de usuario activa.
 * Previene la eliminación si existen servicios asociados mediante clave foránea.
 */
export const removeCategory = async (id: string, token: string): Promise<void> => {
    const performer = decodeToken(token);

    if (!canManageServiceCategories(performer)) {
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
            throw new ApiError(ApiErrorCode.BAD_REQUEST, 'Cannot delete category because it has services assigned');
        }
        throw error;
    }
};
