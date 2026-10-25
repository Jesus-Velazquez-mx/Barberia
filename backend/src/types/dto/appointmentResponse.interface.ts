import type { AppointmentStatus } from '../entities/appointment.interface.js';

export interface AppointmentServiceResponse {
    serviceId: string;
    priceAtBooking: number;
    durationMinutesAtBooking: number;
}
export interface ClientAppointmentResponse {
    id: string;
    shopId: string;
    barberId: string;
    status: AppointmentStatus;
    scheduledStart: Date;
    scheduledEnd: Date;
    notes: string | null;
    services: AppointmentServiceResponse[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AppointmentResponse extends ClientAppointmentResponse {
    client: AppointmentClient | null;
    isRegisteredClient: boolean;
    guestClientName: string | null;
}

export interface AppointmentClient {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    completedServicesCount: number;
}
