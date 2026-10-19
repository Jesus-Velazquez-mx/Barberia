import type { AppointmentStatus } from '../entities/appointment.interface.js';

export interface AppointmentServiceResponse {
    serviceId: string;
    priceAtBooking: number;
    durationMinutesAtBooking: number;
}

export interface AppointmentResponse {
    id: string;
    shopId: string;
    barberId: string;
    clientId: string | null;
    isRegisteredClient: boolean;
    guestClientName: string | null;
    status: AppointmentStatus;
    scheduledStart: Date;
    scheduledEnd: Date;
    notes: string | null;
    services: AppointmentServiceResponse[];
    createdAt: Date;
    updatedAt: Date;
}
