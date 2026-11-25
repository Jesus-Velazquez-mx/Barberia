import { apiClient } from './apiClient';
import type { BarberPerformanceQuery, BarberPerformanceReport } from '../types/reportType';

const authHeaders = (token: string): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } });

/* El backend responde 403 si la sucursal no está a cargo del manager, 400 si el rango de fechas no es válido
   y 404 si no hay servicios finalizados en el rango o ningún barbero coincide con el nombre. */
export const getBarberPerformanceReport = async (
    query: BarberPerformanceQuery,
    token: string
): Promise<BarberPerformanceReport> => {
    const params = new URLSearchParams({
        shopId: query.shopId,
        startDate: query.startDate,
        endDate: query.endDate
    });
    if (query.firstName) params.set('firstName', query.firstName);
    if (query.lastName) params.set('lastName', query.lastName);

    const { data } = await apiClient.get<BarberPerformanceReport>(
        `/reports/barber-performance?${params.toString()}`,
        authHeaders(token)
    );
    return data;
};
