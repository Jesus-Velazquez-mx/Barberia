import { apiClient } from './apiClient';
import type { Shop, ShopPayload } from '../types/shop.ts';
import type { PublicBarber } from '../types/barber.ts';
import type { OfferedService } from '../types/offeredService.ts';

export const getShops = async (): Promise<Shop[]> => {
    const response = await apiClient.get<Shop[]>('/shops');
    return response.data;
};

/* Endpoint público: sin token devuelve solo la vista pública de los barberos disponibles. */
export const getActiveBarbersByShop = async (shopId: string): Promise<PublicBarber[]> => {
    const response = await apiClient.get<PublicBarber[]>(`/shops/${shopId}/barbers`);
    return response.data;
};

export const getOfferedServices = async (token: string): Promise<OfferedService[]> => {
    const response = await apiClient.get<OfferedService[]>('/offeredServices', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/* ---------- Administración de sucursales (manager) ---------- */

export const createShop = async (payload: ShopPayload, token: string): Promise<Shop> => {
    const response = await apiClient.post<Shop>('/shops', payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateShop = async (id: string, payload: ShopPayload, token: string): Promise<Shop> => {
    const response = await apiClient.put<Shop>(`/shops/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/* Baja lógica (is_active = false): la sucursal deja de aparecer en el listado. */
export const deleteShop = async (shop: Shop, token: string): Promise<void> => {
    await apiClient.delete(`/shops/${shop.id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};