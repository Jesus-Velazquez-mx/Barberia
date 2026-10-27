import { apiClient } from './apiClient';
import type { Shop } from '../types/shop.ts';
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
