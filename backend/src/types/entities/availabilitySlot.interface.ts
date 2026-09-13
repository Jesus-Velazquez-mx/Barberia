export interface AvailabilitySlot {
    id: string;
    barber_id: string;
    shop_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}