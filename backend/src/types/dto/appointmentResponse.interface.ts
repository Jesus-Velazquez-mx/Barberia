import type { AppointmentStatus } from '../entities/appointment.interface.js';

export interface AppointmentResponse {
    id: string;
    shopId: string;
    barberId: string | null;
    clientId: string | null;
    isRegisteredClient: boolean;
    guestClientName: string | null;
    status: AppointmentStatus;
    scheduledStart: Date;
    scheduledEnd: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}
