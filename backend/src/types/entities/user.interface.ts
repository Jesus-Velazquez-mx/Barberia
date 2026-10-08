export type UserRole = 'client' | 'manager' | 'receptionist';

export interface User {
    id: string;
    role: UserRole;
    email: string;
    phone: string | null;
    password_hash: string;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: string;
    created_at: Date;
    updated_at: Date;
}
