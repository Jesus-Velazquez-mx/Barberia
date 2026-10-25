import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    getAllCategories,
    getCategoryById,
    getCategoryByName,
    createCategory as repoCreateCategory,
    updateCategory as repoUpdateCategory,
    softDeleteCategory as repoSoftDeleteCategory,
} from '../repositories/serviceCategoryRepository.js';
import { isUserActive } from '../repositories/userRepository.js';
import { decodeToken } from './jwtTokenService.js';
import { canManageServiceCategories } from './userPermissions.js';

/**
 * Recupera el listado completo de categorías de servicios.
 * Accesible para todos los roles, aplicando discriminación de visibilidad.
 */
export const listCategories = async (token: string) => {
    const performer = decodeToken(token);

    // Valida que la cuenta del usuario se encuentre activa en el sistema
    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    let categories = await getAllCategories();

    // Si el usuario es cliente, solo visualiza categorías activas
    if (performer.role === 'client') {
        categories = categories.filter((c) => c.is_active === true);
    }

    return categories;
};

/**
 * Obtiene los detalles de una categoría específica por su ID.
 * Accesible para todos, protegiendo las categorías inactivas frente a los clientes.
 */
export const getCategory = async (id: string, token: string) => {
    const performer = decodeToken(token);

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const category = await getCategoryById(id);
    if (!category) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }

    // Si es cliente y la categoría está inactiva, simulamos un 404
    if (performer.role === 'client' && category.is_active === false) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }

    return category;
};

/**
 * Registra una nueva categoría de servicios.
 */
export const registerCategory = async (
    data: { name: string; description?: string | null; isActive?: boolean },
    token: string
) => {
    const performer = decodeToken(token);

    // Valida permisos administrativos
    if (!canManageServiceCategories(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to create categories');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    // Valida que no exista otra categoría con el mismo nombre
    const existing = await getCategoryByName(data.name);
    if (existing) {
        throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Category name is already in use');
    }

    return await repoCreateCategory(data);
};

/**
 * Actualiza los datos de una categoría existente y ejecuta la desactivación
 * en cascada de sus servicios si la categoría es inhabilitada.
 */
export const editCategory = async (
    id: string,
    data: { name?: string; description?: string | null; isActive?: boolean },
    token: string
) => {
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

    // Valida unicidad del nombre en caso de que este haya sido modificado
    if (data.name && data.name.toLowerCase() !== category.name.toLowerCase()) {
        const existing = await getCategoryByName(data.name);
        if (existing && existing.id !== id) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Category name is already in use');
        }
    }

    // Actualiza la categoría; si se inactiva, el repositorio desactiva sus servicios en la misma transacción
    return await repoUpdateCategory(id, data);
};

/**
 * Elimina lógicamente una categoría de servicios: la desactiva junto con todos sus
 * servicios asociados, conservando el historial de citas.
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

    await repoSoftDeleteCategory(id);
};
