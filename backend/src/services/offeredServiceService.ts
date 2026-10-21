import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    getAllServices,
    getServiceById,
    getServiceByName,
    createService as repoCreateService,
    updateService as repoUpdateService,
    softDeleteService as repoSoftDeleteService,
    type ServiceFilterOptions,
} from '../repositories/offeredServiceRepository.js';
import { getCategoryById } from '../repositories/serviceCategoryRepository.js'; 
import { isUserActive } from '../repositories/userRepository.js';
import { decodeToken } from './jwtTokenService.js';
import { canManageServices } from './userPermissions.js';
import type { CreateServiceRequest, UpdateServiceRequest } from '../types/dto/serviceRequest.interface.js';
import type { OfferedServicesResponse } from '../types/dto/offeredServiceResponse.interface.js';
import { toOfferedServiceResponse } from '../utils/offeredServicesMapper.js';

export const listAllServices = async (token: string, categoryId?: string): Promise<OfferedServicesResponse[]> => {
    const performer = decodeToken(token);

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const filters: ServiceFilterOptions = {};
    if (categoryId) {
        filters.categoryId = categoryId;
    }

    // Si es cliente, inyectamos el filtro isActive = true
    if (performer.role === 'client') {
        filters.isActive = true;
    }

    const services = await getAllServices(filters);
    return services.map(toOfferedServiceResponse);
};

export const getOfferedServiceById = async (id: string, token: string): Promise<OfferedServicesResponse> => {
    const performer = decodeToken(token);

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const service = await getServiceById(id);
    if (!service) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');
    }

    // DISCRIMINACIÓN POR ROLES: Ocultamos el servicio al cliente si está inhabilitado
    if (performer.role === 'client' && service.is_active === false) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');
    }

    return toOfferedServiceResponse(service);
};

/**
 * Registra un nuevo servicio.
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
    if (!category) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service category not found');

    const existing = await getServiceByName(data.name);
    if (existing) throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Service name is already in use');

    const newService = await repoCreateService(data);
    return toOfferedServiceResponse(newService);
};

/**
 * Edita un servicio.
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
    if (!service) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');

    if (data.categoryId) {
        const category = await getCategoryById(data.categoryId);
        if (!category) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service category not found');
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
 * Borrado lógico del servicio (inhabilitar).
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
    if (!service) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');

    await repoSoftDeleteService(id);
};