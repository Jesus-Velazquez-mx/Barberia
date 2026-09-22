export type UserRole = 'client' | 'barber' | 'manager' | 'receptionist';

export interface User {
    id: string;
    role: UserRole;
    email: string;
    phone: string | null;
    password_hash: string;
    first_name: string;
    last_name: string;
    created_at: Date;
    updated_at: Date;
    // Set from barbers/managers/receptionists.deleted_at (whichever matches the
    // user's role), never a real users column. Only meaningful for staff roles —
    // always null for clients, who are hard-deleted instead of soft-deleted.
    staff_deleted_at: Date | null;
}