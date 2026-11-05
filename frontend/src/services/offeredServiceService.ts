import { apiClient } from './apiClient';
import type { OfferedService, OfferedServicePayload } from '../types/offeredService';

/*
 * Servicio de servicios ofrecidos (catálogo del dashboard de staff).
 *
 *   getOfferedServicesCatalog -> GET    /offeredServices?includeInactive=true (manager y recepcionista reciben activos e inactivos)
 *   createOfferedService      -> POST   /offeredServices         (solo manager)
 *   updateOfferedService      -> PUT    /offeredServices/:id     (solo manager; acepta isActive para reactivar)
 *   deleteOfferedService      -> DELETE /offeredServices/:id     (solo manager; borrado lógico: isActive = false)
 *
 * El backend ya responde en camelCase (offeredServicesMapper) y con `price` numérico.
 * Los errores 409/404 llegan en inglés; utils/offeredServiceUtils.ts los traduce.
 * shopService.getOfferedServices (flujo de reserva) es otra función y no se toca.
 */

export const getOfferedServicesCatalog = async (token: string): Promise<OfferedService[]> => {
    const response = await apiClient.get<OfferedService[]>('/offeredServices?includeInactive=true', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createOfferedService = async (payload: OfferedServicePayload, token: string): Promise<OfferedService> => {
    const response = await apiClient.post<OfferedService>('/offeredServices', payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateOfferedService = async (
    id: string,
    payload: OfferedServicePayload,
    token: string
): Promise<OfferedService> => {
    const response = await apiClient.put<OfferedService>(`/offeredServices/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteOfferedService = async (id: string, token: string): Promise<void> => {
    await apiClient.delete(`/offeredServices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
