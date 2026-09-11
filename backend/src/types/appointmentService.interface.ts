export interface AppointmentService {
    id: string;
    appointment_id: string;
    service_id: string;
    price_at_booking: string; // numeric(10,2)
    duration_minutes_at_booking: number;
    created_at: Date;
}