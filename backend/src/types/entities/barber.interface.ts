export interface Barber {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    shop_id: string;
    shift_id: string;
    bio: string | null;
    is_accepting_bookings: boolean;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
