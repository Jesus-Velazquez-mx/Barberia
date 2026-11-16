import { apiClient } from './apiClient';
import { getShops } from './shopService';
import type { Supply, SupplyPayload, SupplyShop } from '../types/supplyType';

interface SupplyApi {
    id: string;
    shop_id: string;
    category_id: string;
    name: string;
    description: string | null;
    unit: string;
    sku: string | null;
    created_at: string;
    updated_at: string;
}

const authHeaders = (token: string): RequestInit => ({
    headers: { Authorization: `Bearer ${token}` }
});

const toSupply = (item: SupplyApi): Supply => ({
    id: item.id,
    shopId: item.shop_id,
    categoryId: item.category_id,
    name: item.name,
    description: item.description,
    unit: item.unit,
    sku: item.sku,
    createdAt: item.created_at,
    updatedAt: item.updated_at
});

/**
 * Obtiene la lista de insumos. Opcionalmente filtrados por varias sucursales.
 * Requiere token con rol manager.
 */
export const getSupplies = async (token: string, shopIds: string[]): Promise<Supply[]> => {
    const query = shopIds.length > 0 ? `?${shopIds.map((id) => `shopIds=${encodeURIComponent(id)}`).join('&')}` : '';
    const response = await apiClient.get<SupplyApi[]>(`/supplies${query}`, authHeaders(token));
    return response.data.map(toSupply);
};

/**
 * Obtiene un insumo por su ID único.
 */
export const getSupplyById = async (id: string, token: string): Promise<Supply> => {
    const response = await apiClient.get<SupplyApi>(`/supplies/${id}`, authHeaders(token));
    return toSupply(response.data);
};

/**
 * Registra un nuevo insumo. No gestiona stock ni existencias.
 * El backend valida unicidad de nombre y SKU por sucursal (409).
 */
export const createSupply = async (payload: SupplyPayload, token: string): Promise<Supply> => {
    const response = await apiClient.post<SupplyApi>('/supplies', payload, authHeaders(token));
    return toSupply(response.data);
};

/**
 * Actualiza los datos de un insumo existente.
 */
export const updateSupply = async (id: string, payload: Partial<SupplyPayload>, token: string): Promise<Supply> => {
    const response = await apiClient.put<SupplyApi>(`/supplies/${id}`, payload, authHeaders(token));
    return toSupply(response.data);
};

/**
 * Elimina físicamente un insumo existente.
 */
export const deleteSupply = async (id: string, token: string): Promise<void> => {
    await apiClient.delete(`/supplies/${id}`, authHeaders(token));
};

/**
 * Obtiene la lista de sucursales para los selectores y filtros de insumos.
 * Consume el endpoint público de sucursales (/shops).
 */
export const getSupplyShops = async (): Promise<SupplyShop[]> => {
    const shops = await getShops();
    return shops.map((shop) => ({
        id: shop.id,
        name: shop.name
    }));
};
