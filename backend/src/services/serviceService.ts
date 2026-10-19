import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    getAllServices,
    getServiceById,
    getServiceByName,
    createService as repoCreateService,
    updateService as repoUpdateService,
    softDeleteService as repoSoftDeleteService,
    type ServiceFilterOptions,
} from '../repositories/serviceRepository.js';
import { getCategoryById } from '../repositories/serviceCategoryRepository.js';
import { isUserActive } from '../repositories/userRepository.js';
import { decodeToken } from './jwtTokenService.js';
import { canManageServices } from './userPermissions.js';
import type { CreateServiceRequest, UpdateServiceRequest } from '../types/dto/serviceRequest.interface.js';
import type { OfferedServicesResponse } from '../types/dto/offeredServiceResponse.interface.js';
import { toOfferedServiceResponse } from '../utils/offeredServicesMapper.js';

/**
 * Recupera el catálogo de servicios con filtros opcionales.
 * Requiere rol de manager y cuenta de usuario activa.
 */
export const listServices = async (
    filters: ServiceFilterOptions,
    token: string
): Promise<OfferedServicesResponse[]> => {
    const performer = decodeToken(token);

    if (!canManageServices(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to view services');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const services = await getAllServices(filters);
    return services.map(toOfferedServiceResponse);
};

/**
 * Obtiene los detalles de un servicio específico por su identificador único.
 * Requiere rol de manager y cuenta de usuario activa.
 */
export const getService = async (id: string, token: string): Promise<OfferedServicesResponse> => {
    const performer = decodeToken(token);

    if (!canManageServices(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to view services');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const service = await getServiceById(id);
    if (!service) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');
    }

    return toOfferedServiceResponse(service);
};

/**
 * Registra un nuevo servicio en el catálogo.
 * Requiere rol de manager y cuenta de usuario activa.
 * Valida que la categoría exista y que el nombre del servicio no esté en uso.
 */
export const registerService = async (
    data: CreateServiceRequest,
    token: string
): Promise<OfferedServicesResponse> => {
    const performer = decodeToken(token);

    if (!canManageServices(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to create services');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const category = await getCategoryById(data.categoryId);
    if (!category) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service category not found');
    }

    const existing = await getServiceByName(data.name);
    if (existing) {
        throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Service name is already in use');
    }

    const newService = await repoCreateService(data);
    return toOfferedServiceResponse(newService);
};

/**
 * Actualiza la información de un servicio existente en el catálogo.
 * Requiere rol de manager y cuenta de usuario activa.
 * Valida la existencia del servicio, de la categoría (si se actualiza) y la unicidad del nombre.
 */
export const editService = async (
    id: string,
    data: UpdateServiceRequest,
    token: string
): Promise<OfferedServicesResponse> => {
    const performer = decodeToken(token);

    if (!canManageServices(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to update services');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const service = await getServiceById(id);
    if (!service) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');
    }

    if (data.categoryId) {
        const category = await getCategoryById(data.categoryId);
        if (!category) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service category not found');
        }
    }

    if (data.name && data.name.toLowerCase() !== service.name.toLowerCase()) {
        const existing = await getServiceByName(data.name);
        if (existing && existing.id !== id) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Service name is already in use');
        }
    }

    const updatedService = await repoUpdateService(id, data);
    return toOfferedServiceResponse(updatedService);
};

/**
 * Realiza un borrado lógico de un servicio cambiando su estado a inactivo.
 * Requiere rol de manager y cuenta de usuario activa.
 */
export const removeService = async (id: string, token: string): Promise<void> => {
    const performer = decodeToken(token);

    if (!canManageServices(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to delete services');
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const service = await getServiceById(id);
    if (!service) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');
    }

    await repoSoftDeleteService(id);
};
