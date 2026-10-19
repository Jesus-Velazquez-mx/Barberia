import { apiClient } from './apiClient';
import type { AvailableSlotsByBarber, GetAvailabilityParams } from '../types/availabilityType'; // Ajusta el nombre del archivo si lo renombraste a availability.ts

export const getShopAvailability = async ({
    shopId,
    date,
    serviceIds,
}: GetAvailabilityParams): Promise<AvailableSlotsByBarber[]> => {
    const query = new URLSearchParams({ date, serviceIds: serviceIds.join(',') }).toString();
    const response = await apiClient.get<AvailableSlotsByBarber[]>(
        `/shops/${shopId}/availability?${query}`
    );
    return response.data;
};