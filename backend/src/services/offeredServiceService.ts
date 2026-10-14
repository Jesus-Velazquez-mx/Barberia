import { getActiveServices, getServiceById } from '../repositories/offeredServiceRepository.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { toOfferedServiceResponse } from '../utils/offeredServicesMapper.js';

export const listAllServices = async () => {
    const services = await getActiveServices();
    return services.map(toOfferedServiceResponse);
}

export const getOfferedServiceById = async (id: string) => {
    const service = await getServiceById(id);
    if (!service || !service.is_active) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');
    }
    return toOfferedServiceResponse(service);
};