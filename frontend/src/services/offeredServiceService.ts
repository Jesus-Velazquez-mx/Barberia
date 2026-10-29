import type { OfferedService, OfferedServicePayload } from '../types/offeredService';
import {
    mockCreateOfferedService,
    mockDeleteOfferedService,
    mockListOfferedServices,
    mockUpdateOfferedService
} from '../mocks/offeredServiceMock';

/*
 * Servicio de servicios ofrecidos (catálogo del dashboard de staff).
 * Hoy responde con datos mock. Para integrar con el backend solo cambia el cuerpo de estas funciones
 * (usando apiClient y el token); los contenedores no se tocan:
 *
 *   getOfferedServicesCatalog -> GET    /offeredServices         (acepta ?categoryId=; manager y recepcionista
 *                                                                reciben activos e inactivos)
 *   createOfferedService      -> POST   /offeredServices         (solo manager)
 *   updateOfferedService      -> PUT    /offeredServices/:id     (solo manager; acepta isActive para reactivar)
 *   deleteOfferedService      -> DELETE /offeredServices/:id     (solo manager; borrado lógico: isActive = false)
 *
 * Detalles del backend a tener en cuenta:
 *   - Responde ya en camelCase (offeredServicesMapper), así que coincide con el tipo OfferedService.
 *   - `price` puede llegar como string desde PostgreSQL (NUMERIC); conviene envolverlo en Number().
 *   - Los errores 409/404 llegan en inglés ('Service name is already in use', 'Service category not found');
 *     utils/offeredServiceUtils.ts ya los traduce.
 *   - shopService.getOfferedServices (flujo de reserva) es otra función y no se toca.
 */

export const getOfferedServicesCatalog = async (_token: string): Promise<OfferedService[]> =>
    mockListOfferedServices();

export const createOfferedService = async (payload: OfferedServicePayload, _token: string): Promise<OfferedService> =>
    mockCreateOfferedService(payload);

export const updateOfferedService = async (
    id: string,
    payload: OfferedServicePayload,
    _token: string
): Promise<OfferedService> => mockUpdateOfferedService(id, payload);

export const deleteOfferedService = async (id: string, _token: string): Promise<void> => mockDeleteOfferedService(id);
