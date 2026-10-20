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
import { deactivateServicesByCategoryId } from '../repositories/offeredServiceRepository.js';

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
        categories = categories.filter(c => c.is_active === true);
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
export const registerCategory = async (data: { name: string; description?: string | null; isActive?: boolean }, token: string) => {
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

    // Actualiza los datos de la categoría en la base de datos
    const updatedCategory = await repoUpdateCategory(id, data);

    // Si el manager apaga la categoría, inactiva todos sus servicios hijos
    if (data.isActive === false) {
        await deactivateServicesByCategoryId(id);
    }

    return updatedCategory;
};

/**
 * Elimina una categoría de servicios del sistema.
 * Previene la eliminación si cuenta con servicios asociados por integridad referencial.
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
        // Captura errores de violación de llave foránea en PostgreSQL (códigos 23503 y 23001)
        const dbError = error as { code?: string };
        if (dbError.code === '23503' || dbError.code === '23001') {
            throw new ApiError(ApiErrorCode.BAD_REQUEST, 'Cannot delete category because it has services assigned');
        }
        throw error;
    }
};