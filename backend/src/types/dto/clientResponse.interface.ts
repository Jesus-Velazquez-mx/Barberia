import type { FacialStructureType } from '../entities/client.interface.js';
import type { UserRole } from '../entities/user.interface.js';

export interface ClientResponse {
    userId: string;
    facialStructureType: FacialStructureType | null;
    completedServicesCount: number;
}

export interface ClientDetailResponse {
    id: string;
    role: UserRole;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    birthDate: Date;
    gender: string;
    facialStructureType: FacialStructureType | null;
    completedServicesCount: number;
    createdAt: Date;
    updatedAt: Date;
}
