import { apiClient } from './apiClient';
import type { ServiceCategory, ServiceCategoryPayload } from '../types/serviceCategoryType';

/*
 * Servicio de categorías de servicios.
 *
 *   getServiceCategories  -> GET    /servicesCategories          (manager y recepcionista ven activas e inactivas)
 *   createServiceCategory -> POST   /servicesCategories          (solo manager)
 *   updateServiceCategory -> PUT    /servicesCategories/:id      (solo manager; si isActive pasa a false,
 *                                                                 desactiva en cascada sus servicios)
 *   deleteServiceCategory -> DELETE /servicesCategories/:id      (solo manager; borrado lógico de la categoría
 *                                                                 y de todos sus servicios)
 *
 * Los errores llegan en inglés ('Category name is already in use', 'Category not found');
 * utils/offeredServiceUtils.ts los traduce.
 */

/* El backend devuelve las filas tal como salen de la BD (snake_case). */
interface ServiceCategoryRow {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const toServiceCategory = (row: ServiceCategoryRow): ServiceCategory => ({
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

export const getServiceCategories = async (token: string): Promise<ServiceCategory[]> => {
    const response = await apiClient.get<ServiceCategoryRow[]>('/servicesCategories', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.map(toServiceCategory);
};

export const createServiceCategory = async (
    payload: ServiceCategoryPayload,
    token: string
): Promise<ServiceCategory> => {
    const response = await apiClient.post<ServiceCategoryRow>('/servicesCategories', payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return toServiceCategory(response.data);
};

export const updateServiceCategory = async (
    id: string,
    payload: ServiceCategoryPayload,
    token: string
): Promise<ServiceCategory> => {
    const response = await apiClient.put<ServiceCategoryRow>(`/servicesCategories/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return toServiceCategory(response.data);
};

export const deleteServiceCategory = async (id: string, token: string): Promise<void> => {
    await apiClient.delete(`/servicesCategories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
