export interface CreateAppointmentRequest {
    shopId: string;
    barberId: string;
    serviceIds: string[];
    scheduledStart: string;
    clientId?: string;
    guestClientName?: string;
    notes?: string;
}
