import { apiClient } from './apiClient';
import type { SupplyCategory, SupplyCategoryPayload } from '../types/supplyCategoryType';

interface SupplyCategoryApi {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

const authHeaders = (token: string): RequestInit => ({
    headers: { Authorization: `Bearer ${token}` }
});

const toSupplyCategory = (item: SupplyCategoryApi): SupplyCategory => ({
    id: item.id,
    name: item.name,
    description: item.description,
    createdAt: item.created_at,
    updatedAt: item.updated_at
});

/**
 * Obtiene el listado completo de categorías de insumos.
 * Requiere token con rol manager.
 */
export const getSupplyCategories = async (token: string): Promise<SupplyCategory[]> => {
    const response = await apiClient.get<SupplyCategoryApi[]>('/suppliesCategories', authHeaders(token));
    return response.data.map(toSupplyCategory);
};

/**
 * Obtiene los detalles de una categoría específica por su ID.
 */
export const getSupplyCategoryById = async (id: string, token: string): Promise<SupplyCategory> => {
    const response = await apiClient.get<SupplyCategoryApi>(`/suppliesCategories/${id}`, authHeaders(token));
    return toSupplyCategory(response.data);
};

/**
 * Registra una nueva categoría de insumos.
 * Valida unicidad de nombre en backend (409 si colisiona).
 */
export const createSupplyCategory = async (payload: SupplyCategoryPayload, token: string): Promise<SupplyCategory> => {
    const response = await apiClient.post<SupplyCategoryApi>('/suppliesCategories', payload, authHeaders(token));
    return toSupplyCategory(response.data);
};

/**
 * Actualiza los datos de una categoría existente.
 */
export const updateSupplyCategory = async (
    id: string,
    payload: Partial<SupplyCategoryPayload>,
    token: string
): Promise<SupplyCategory> => {
    const response = await apiClient.put<SupplyCategoryApi>(`/suppliesCategories/${id}`, payload, authHeaders(token));
    return toSupplyCategory(response.data);
};

/**
 * Elimina físicamente una categoría de insumos.
 * Devuelve error 400 si la categoría tiene suministros asignados.
 */
export const deleteSupplyCategory = async (id: string, token: string): Promise<void> => {
    await apiClient.delete(`/suppliesCategories/${id}`, authHeaders(token));
};
