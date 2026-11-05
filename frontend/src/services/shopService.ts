import { apiClient } from './apiClient';
import type { Shop, ShopPayload } from '../types/shop.ts';
import type { PublicBarber } from '../types/barber.ts';
import type { OfferedService } from '../types/offeredService.ts';

const authHeaders = (token: string): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } });

/* Por defecto devuelve solo sucursales activas (flujo de agendar cita).
   Con includeInactive=true y token de manager devuelve todas sus sucursales (activas e inactivas). */
export const getShops = async (token?: string, includeInactive = false): Promise<Shop[]> => {
    const path = includeInactive ? '/shops?includeInactive=true' : '/shops';
    const response = token ? await apiClient.get<Shop[]>(path, authHeaders(token)) : await apiClient.get<Shop[]>(path);
    return response.data;
};

/* Endpoint público: sin token devuelve solo la vista pública de los barberos disponibles. */
export const getActiveBarbersByShop = async (shopId: string): Promise<PublicBarber[]> => {
    const response = await apiClient.get<PublicBarber[]>(`/shops/${shopId}/barbers`);
    return response.data;
};

/* Por defecto solo servicios activos (flujo de reserva). includeInactive solo tiene efecto para el staff. */
export const getOfferedServices = async (token: string, includeInactive = false): Promise<OfferedService[]> => {
    const response = await apiClient.get<OfferedService[]>(`/offeredServices?includeInactive=${includeInactive}`, authHeaders(token));
    return response.data;
};

/* ---------- Administración de sucursales (manager) ---------- */

/* El backend responde 409 si el nombre ya está en uso. */
export const createShop = async (payload: ShopPayload, token: string): Promise<Shop> => {
    const response = await apiClient.post<Shop>('/shops', payload, authHeaders(token));
    return response.data;
};

/* Acepta isActive para reactivar o desactivar una sucursal desde el formulario de edición. */
export const updateShop = async (id: string, payload: ShopPayload, token: string): Promise<Shop> => {
    const response = await apiClient.put<Shop>(`/shops/${id}`, payload, authHeaders(token));
    return response.data;
};

/* Baja lógica (is_active = false): la sucursal se marca como inactiva en la base de datos. */
export const deleteShop = async (shop: Pick<Shop, 'id'>, token: string): Promise<void> => {
    await apiClient.delete(`/shops/${shop.id}`, authHeaders(token));
};
