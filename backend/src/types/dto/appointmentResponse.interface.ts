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
    isWalkIn: boolean;
    status: AppointmentStatus;
    originalScheduledStart: Date;
    scheduledStart: Date;
    scheduledEnd: Date;
    checkedInAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    cancelationReason: string | null;
    notes: string | null;
    isRewardRedemption: boolean;
    services: AppointmentServiceResponse[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AppointmentResponse extends ClientAppointmentResponse {
    client: AppointmentClient | null;
    guestClientName: string | null;
    clientEmail: string;
    isRegisteredClient: boolean;
}

export interface AppointmentClient {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    completedServicesCount: number;
}
