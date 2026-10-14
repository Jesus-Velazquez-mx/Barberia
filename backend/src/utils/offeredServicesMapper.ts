import type { OfferedService } from '../types/entities/offeredService.interface.js';
import type { OfferedServicesResponse } from '../types/dto/offeredServiceResponse.interface.js';

export const toOfferedServiceResponse = (service: OfferedService): OfferedServicesResponse => {
    return {
        id: service.id,
        categoryId: service.category_id,
        name: service.name,
        description: service.description,
        durationMinutes: service.duration_minutes,
        price: Number(service.price),
        isActive: service.is_active,
        createdAt: service.created_at,
        updatedAt: service.updated_at,
    };
};