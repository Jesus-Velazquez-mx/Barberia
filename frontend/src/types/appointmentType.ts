/* Estados que muestra la vista de citas del personal. */
export type AppointmentStatus = 'scheduled' | 'rescheduled' | 'checkedIn' | 'completed' | 'cancelled' | 'noShow';

export interface AppointmentServiceItem {
    serviceId: string;
    name: string;
    priceAtBooking: number;
    durationMinutesAtBooking: number;
}

/* Cita lista para mostrarse: ya trae los nombres (cliente, barbero, sucursal, servicios).
   El GET /appointments del backend solo devuelve ids; el servicio se encarga de completarlos
   (ver services/appointmentService.ts). */
export interface AppointmentRecord {
    id: string;
    shopId: string;
    shopName: string;
    barberId: string;
    barberName: string;
    /* null para invitados o para clientes cuya cuenta fue eliminada. */
    clientId: string | null;
    isRegisteredClient: boolean;
    clientName: string;
    /* null para invitados. */
    clientEmail: string | null;
    status: AppointmentStatus;
    /* ISO 8601 (UTC). */
    scheduledStart: string;
    scheduledEnd: string;
    checkedInAt: string | null;
    completedAt: string | null;
    /* Solo en citas reagendadas: fecha y hora en que estaba agendada originalmente. */
    originalScheduledStart: string | null;
    /* Solo en citas canceladas. */
    cancelledAt: string | null;
    cancellationReason: string | null;
    notes: string | null;
    /* true cuando la cita se canjeó con la recompensa de lealtad (is_reward_redemption). */
    isRewardRedemption: boolean;
    services: AppointmentServiceItem[];
    createdAt: string;
    updatedAt: string;
}

/* Valores de los filtros (formulario). Las fechas son texto dd/mm/aaaa, como en DateField;
   '' significa "sin límite". */
export interface AppointmentFilterValues {
    serviceFrom: string;
    serviceTo: string;
    createdFrom: string;
    createdTo: string;
    /* 'all' = todas las sucursales. */
    shopId: string;
    /* 'all' = todos los servicios. */
    serviceId: string;
    /* 'all' = todos los estados. */
    status: string;
}

export type SortDirection = 'asc' | 'desc';
