import type { UserRole } from '../entities/user.interface.js';

export interface UserResponse {
    id: string;
    role: UserRole;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    birthDate: Date;
    gender: string;
    createdAt: Date;
    updatedAt: Date;
}
