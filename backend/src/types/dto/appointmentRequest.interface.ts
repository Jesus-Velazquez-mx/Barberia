export interface CreateAppointmentRequest {
    shopId: string;
    barberId: string;
    serviceId: string;
    scheduledStart: string;
    clientId?: string;
    guestClientName?: string;
    notes?: string;
}
