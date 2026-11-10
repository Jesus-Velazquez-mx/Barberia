import type { AppointmentStatus } from '../entities/appointment.interface.js';

export interface CreateAppointmentRequest {
    barberId: string;
    serviceIds: string[];
    scheduledStart: string;
    clientId?: string;
    guestClientName?: string;
    notes?: string;
}

// Todos los campos son opcionales (al menos uno); el cliente, el invitado y la sucursal no se pueden editar.
export interface UpdateAppointmentRequest {
    barberId?: string;
    serviceIds?: string[];
    scheduledStart?: string;
    notes?: string | null;
}

// El motivo es opcional y se guarda en appointments.cancellation_reason (máx. 255 caracteres).
export interface CancelAppointmentRequest {
    reason?: string | null;
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
