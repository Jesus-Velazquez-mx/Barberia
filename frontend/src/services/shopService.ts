import { apiClient } from './apiClient';
import type { Shop } from '../types/shop.ts'
import type { Barber } from '../types/barber.ts'
import type { OfferedService } from '../types/offeredService.ts';

export const getShops = async (): Promise<Shop[]> => {
    const response = await apiClient.get<Shop[]>('/shops');
    return response;
}

export const getActiveBarbersByShop = async (shopId: string): Promise<Barber[]> => {
    const response = await apiClient.get<Barber[]>(`/shops/${shopId}/barbers`);
    return response;
}

export const getOfferedServices = async (): Promise<OfferedService[]> => {
    const response = await apiClient.get<OfferedService[]>('/offeredServices')
    return response;
}