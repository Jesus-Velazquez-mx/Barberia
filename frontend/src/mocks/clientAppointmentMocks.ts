import type { AppointmentRecord, AppointmentServiceItem } from '../types/appointmentType';

const SERVICES: Record<string, AppointmentServiceItem> = {
    classic: { serviceId: 's1', name: 'Corte clásico', priceAtBooking: 180, durationMinutesAtBooking: 30 },
    kids: { serviceId: 's2', name: 'Corte infantil', priceAtBooking: 130, durationMinutesAtBooking: 30 },
    beard: { serviceId: 's3', name: 'Afeitado de barba', priceAtBooking: 120, durationMinutesAtBooking: 30 },
    dye: { serviceId: 's4', name: 'Tinte de cabello', priceAtBooking: 350, durationMinutesAtBooking: 60 }
};

const SHOP = { shopId: 'shop-1', shopName: 'Mr. Barber Sendero' };
const BARBERS = {
    miguel: { barberId: 'b1', barberName: 'Miguel Torres' },
    carlos: { barberId: 'b2', barberName: 'Carlos Ramírez' },
    luis: { barberId: 'b3', barberName: 'Luis Herrera' }
};

type MockSeed = Pick<
    AppointmentRecord,
    'id' | 'status' | 'scheduledStart' | 'scheduledEnd' | 'createdAt' | 'barberId' | 'barberName' | 'services'
> &
    Partial<AppointmentRecord>;

/* Genera las citas del cliente logeado (clientId dinámico) y agrega una cita de otro cliente
   para comprobar que el filtro por cliente funciona. */
export function buildMockAppointments(client: { id: string; name: string; email: string }): AppointmentRecord[] {
    const base = (seed: MockSeed): AppointmentRecord => ({
        ...SHOP,
        clientId: client.id,
        isRegisteredClient: true,
        clientName: client.name,
        clientEmail: client.email,
        /* Las citas completadas llegaron a su hora y terminaron a la hora prevista. */
        checkedInAt: seed.status === 'completed' ? seed.scheduledStart : null,
        completedAt: seed.status === 'completed' ? seed.scheduledEnd : null,
        originalScheduledStart: null,
        cancelledAt: null,
        cancellationReason: null,
        notes: null,
        updatedAt: seed.createdAt,
        ...seed,
        checkedInAt: seed.checkedInAt ?? null,
        completedAt: seed.completedAt ?? null
    });

    const mine: AppointmentRecord[] = [
        // --- Próximas (3) ---
        base({
            id: 'a1',
            status: 'scheduled',
            scheduledStart: '2026-10-25T18:00:00Z',
            scheduledEnd: '2026-10-25T18:30:00Z',
            createdAt: '2026-10-20T16:00:00Z',
            ...BARBERS.miguel,
            services: [SERVICES.classic]
        }),
        base({
            id: 'a2',
            status: 'rescheduled',
            scheduledStart: '2026-10-28T20:00:00Z',
            scheduledEnd: '2026-10-28T21:00:00Z',
            originalScheduledStart: '2026-10-27T20:00:00Z',
            createdAt: '2026-10-18T15:30:00Z',
            ...BARBERS.luis,
            services: [SERVICES.classic, SERVICES.beard]
        }),
        base({
            id: 'a3',
            status: 'scheduled',
            scheduledStart: '2026-11-02T22:00:00Z',
            scheduledEnd: '2026-11-03T00:00:00Z',
            createdAt: '2026-10-23T14:00:00Z',
            ...BARBERS.carlos,
            services: [SERVICES.dye, SERVICES.beard]
        }),

        // --- Pasadas (5) ---
        base({
            // Agendada para hoy, ya terminó su horario → cuenta como pasada.
            id: 'a4',
            status: 'scheduled',
            scheduledStart: '2026-10-23T16:00:00Z',
            scheduledEnd: '2026-10-23T16:30:00Z',
            createdAt: '2026-10-19T17:00:00Z',
            ...BARBERS.miguel,
            services: [SERVICES.beard]
        }),
        base({
            id: 'a5',
            status: 'completed',
            scheduledStart: '2026-10-20T19:00:00Z',
            scheduledEnd: '2026-10-20T19:30:00Z',
            createdAt: '2026-10-14T18:00:00Z',
            ...BARBERS.miguel,
            services: [SERVICES.classic]
        }),
        base({
            id: 'a6',
            status: 'completed',
            scheduledStart: '2026-10-15T17:30:00Z',
            scheduledEnd: '2026-10-15T18:30:00Z',
            createdAt: '2026-10-09T16:00:00Z',
            ...BARBERS.luis,
            services: [SERVICES.classic, SERVICES.beard]
        }),
        base({
            id: 'a7',
            status: 'noShow',
            scheduledStart: '2026-10-10T20:00:00Z',
            scheduledEnd: '2026-10-10T20:30:00Z',
            createdAt: '2026-10-05T15:00:00Z',
            ...BARBERS.carlos,
            services: [SERVICES.classic]
        }),
        base({
            id: 'a8',
            status: 'completed',
            scheduledStart: '2026-10-03T18:00:00Z',
            scheduledEnd: '2026-10-03T19:00:00Z',
            createdAt: '2026-09-28T16:00:00Z',
            ...BARBERS.miguel,
            services: [SERVICES.dye]
        }),

        // --- Cancelada (1) ---
        base({
            id: 'a9',
            status: 'cancelled',
            scheduledStart: '2026-10-22T21:00:00Z',
            scheduledEnd: '2026-10-22T21:30:00Z',
            createdAt: '2026-10-16T16:00:00Z',
            cancelledAt: '2026-10-21T15:00:00Z',
            cancellationReason: 'Cambio de planes',
            ...BARBERS.luis,
            services: [SERVICES.kids]
        })
    ];

    // Cita de OTRO cliente: no debe aparecer en la tabla.
    const other: AppointmentRecord = {
        ...base({
            id: 'x1',
            status: 'scheduled',
            scheduledStart: '2026-10-26T18:00:00Z',
            scheduledEnd: '2026-10-26T18:30:00Z',
            createdAt: '2026-10-22T16:00:00Z',
            ...BARBERS.carlos,
            services: [SERVICES.classic]
        }),
        clientId: 'otro-cliente',
        clientName: 'Otro Cliente',
        clientEmail: 'otro@email.com'
    };

    return [...mine, other];
}
