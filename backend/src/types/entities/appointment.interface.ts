export type AppointmentStatus = 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
    id: string;
    shop_id: string;
    client_id: string;
    barber_id: string | null;
    is_walk_in: boolean;
    status: AppointmentStatus;
    scheduled_start: Date;
    scheduled_end: Date;
    checked_in_at: Date | null;
    completed_at: Date | null;
    cancelled_at: Date | null;
    cancellation_reason: string | null;
    notes: string | null;
    is_reward_redemption: boolean;
    created_at: Date;
    updated_at: Date;
}