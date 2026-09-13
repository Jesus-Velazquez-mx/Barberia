export type UserRole = 'client' | 'barber' | 'manager' | 'receptionist';

export interface User {
    id: string;
    role: UserRole;
    email: string;
    phone: string | null;
    password_hash: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
}