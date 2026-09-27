import type { FacialStructureType } from '../entities/client.interface.js';

export interface ClientResponse {
    userId: string;
    facialStructureType: FacialStructureType | null;
    completedServicesCount: number;
}
