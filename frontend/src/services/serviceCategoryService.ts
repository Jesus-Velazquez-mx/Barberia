import type { ServiceCategory, ServiceCategoryPayload } from '../types/serviceCategoryType';
import {
    mockCreateServiceCategory,
    mockDeleteServiceCategory,
    mockListServiceCategories,
    mockUpdateServiceCategory
} from '../mocks/offeredServiceMock';

/*
 * Servicio de categorías de servicios.
 * Hoy responde con datos mock. Para integrar con el backend solo cambia el cuerpo de estas funciones
 * (usando apiClient y el token); los contenedores no se tocan:
 *
 *   getServiceCategories  -> GET    /servicesCategories          (manager y recepcionista ven activas e inactivas)
 *   createServiceCategory -> POST   /servicesCategories          (solo manager)
 *   updateServiceCategory -> PUT    /servicesCategories/:id      (solo manager; si isActive pasa a false,
 *                                                                 desactiva en cascada sus servicios)
 *   deleteServiceCategory -> DELETE /servicesCategories/:id      (solo manager; borrado lógico de la categoría
 *                                                                 y de todos sus servicios)
 *
 * Detalles del backend a tener en cuenta:
 *   - Devuelve las filas tal como salen de la BD (snake_case: is_active, created_at, updated_at);
 *     hay que convertirlas a camelCase para que coincidan con el tipo ServiceCategory.
 *   - Los errores llegan en inglés ('Category name is already in use', 'Category not found');
 *     utils/offeredServiceUtils.ts ya los traduce.
 */

export const getServiceCategories = async (_token: string): Promise<ServiceCategory[]> => mockListServiceCategories();

export const createServiceCategory = async (
    payload: ServiceCategoryPayload,
    _token: string
): Promise<ServiceCategory> => mockCreateServiceCategory(payload);

export const updateServiceCategory = async (
    id: string,
    payload: ServiceCategoryPayload,
    _token: string
): Promise<ServiceCategory> => mockUpdateServiceCategory(id, payload);

export const deleteServiceCategory = async (id: string, _token: string): Promise<void> =>
    mockDeleteServiceCategory(id);
