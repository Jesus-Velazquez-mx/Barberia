import type { FacialStructureType } from '../entities/client.interface.js';

export interface HaircutStyleResponse {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    facialStructures: FacialStructureType[];
    createdAt: Date;
    updatedAt: Date;
}
