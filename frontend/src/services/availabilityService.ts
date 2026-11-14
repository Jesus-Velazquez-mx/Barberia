import { apiClient } from './apiClient';
import type { AvailableSlotsByBarber, GetAvailabilityParams } from '../types/availabilityType'; // Ajusta el nombre del archivo si lo renombraste a availability.ts

export const getShopAvailability = async ({
    shopId,
    date,
    serviceIds,
    excludeAppointmentId,
    token
}: GetAvailabilityParams): Promise<AvailableSlotsByBarber[]> => {
    const params = new URLSearchParams({ date, serviceIds: serviceIds.join(',') });
    if (excludeAppointmentId) {
        params.set('excludeAppointmentId', excludeAppointmentId);
    }
    const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const response = await apiClient.get<AvailableSlotsByBarber[]>(
        `/shops/${shopId}/availability?${params.toString()}`,
        headers
    );
    return response.data;
};
