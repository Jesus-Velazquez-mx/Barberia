import type { AppointmentStatus } from '../entities/appointment.interface.js';

export interface CreateAppointmentRequest {
    shopId: string;
    barberId: string;
    serviceIds: string[];
    scheduledStart: string;
    clientId?: string;
    guestClientName?: string;
    notes?: string;
}

export type AppointmentClientType = 'registered' | 'visitor';

export interface ListAppointmentsQuery {
    from?: Date;
    to?: Date;
    status?: AppointmentStatus[];
    // Filtros solo para recepción y gerentes; un cliente los ignora.
    clientId?: string;
    shopId?: string;
    clientType?: AppointmentClientType;
    barberId?: string;
}
