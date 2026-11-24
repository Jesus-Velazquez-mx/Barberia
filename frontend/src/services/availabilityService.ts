import { apiClient } from './apiClient';
import type {
    AvailableSlot,
    AvailableSlotsByBarber,
    GetAvailabilityParams,
    GetNextAvailabilityParams,
    NextAvailableSlotApi
} from '../types/availabilityType'; // Ajusta el nombre del archivo si lo renombraste a availability.ts

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

/* Walk-in: próximo slot de hoy de cada barbero, ordenado por hora (el primero es el más próximo).
   Los barberos sin horario restante hoy no vienen; lista vacía si no queda disponibilidad hoy. */
export const getNextAvailability = async ({
    shopId,
    serviceIds,
    token
}: GetNextAvailabilityParams): Promise<AvailableSlot[]> => {
    const params = new URLSearchParams({ serviceIds: serviceIds.join(',') });
    const response = await apiClient.get<NextAvailableSlotApi[]>(
        `/shops/${shopId}/availability/next?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.map((slot) => ({
        barberId: slot.barberId,
        barberName: `${slot.firstName} ${slot.lastName}`.trim(),
        startTime: slot.startTime
    }));
};
