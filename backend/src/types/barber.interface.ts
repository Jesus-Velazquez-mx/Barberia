export interface Barber {
    user_id: string;
    shop_id: string;
    shift_id: string;
    bio: string | null;
    is_accepting_bookings: boolean;
    created_at: Date;
    updated_at: Date;
}