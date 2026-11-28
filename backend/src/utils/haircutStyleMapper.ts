import type { HaircutStyleWithStructures } from '../types/entities/haircutStyle.interface.js';
import type { HaircutStyleResponse } from '../types/dto/haircutStyleResponse.interface.js';

export const toHaircutStyleResponse = (style: HaircutStyleWithStructures): HaircutStyleResponse => ({
    id: style.id,
    name: style.name,
    description: style.description,
    isActive: style.is_active,
    facialStructures: style.facial_structures,
    createdAt: style.created_at,
    updatedAt: style.updated_at,
});
