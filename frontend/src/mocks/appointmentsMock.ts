// Datos mock SOLO para la vista de citas del personal (sin backend).
// Se elimina cuando el servicio de citas use GET /appointments (ver services/appointmentService.ts).
import type { AppointmentRecord, AppointmentServiceItem, AppointmentStatus } from '../types/appointmentType';
import { shiftIsoDate } from '../utils/appointmentUtils';
import { getTodayIso } from '../utils/dateFormat';

/* ---------- Catálogos (mock) ---------- */

const SHOPS = [
    { id: 'shop-1', name: 'Mr. Barber Sendero' },
    { id: 'shop-2', name: 'Mr. Barber Explanada' }
];

const BARBERS = [
    { id: 'barber-1', name: 'Carlos Ramírez', shopId: 'shop-1' },
    { id: 'barber-2', name: 'Miguel Torres', shopId: 'shop-1' },
    { id: 'barber-3', name: 'Luis Herrera', shopId: 'shop-1' },
    { id: 'barber-4', name: 'Jorge Félix', shopId: 'shop-2' },
    { id: 'barber-5', name: 'Ricardo Valdez', shopId: 'shop-2' },
    { id: 'barber-6', name: 'Eduardo Lugo', shopId: 'shop-2' }
];

const SERVICES = [
    { id: 'svc-1', name: 'Corte clásico', price: 200, duration: 30 },
    { id: 'svc-2', name: 'Afeitado de barba', price: 150, duration: 30 },
    { id: 'svc-3', name: 'Tinte de cabello', price: 350, duration: 60 },
    { id: 'svc-4', name: 'Corte infantil', price: 150, duration: 30 },
    { id: 'svc-5', name: 'Perfilado de cejas', price: 80, duration: 15 }
];

const CLIENTS = [
    { id: 'client-1', name: 'Carlos Mendoza Lara', email: 'carlos.mendoza@email.com' },
    { id: 'client-2', name: 'José Hernández Gil', email: 'jose.hernandez@email.com' },
    { id: 'client-3', name: 'Alejandro Cárdenas Ortiz', email: 'alejandro.cardenas@email.com' },
    { id: 'client-4', name: 'Roberto Salazar Nava', email: 'roberto.salazar@email.com' },
    { id: 'client-5', name: 'Diego Padilla Ramos', email: 'diego.padilla@email.com' },
    { id: 'client-6', name: 'Héctor Navarro Cruz', email: 'hector.navarro@email.com' },
    { id: 'client-7', name: 'Sergio Ibarra Mejía', email: 'sergio.ibarra@email.com' },
    { id: 'client-8', name: 'Pablo Ontiveros Díaz', email: 'pablo.ontiveros@email.com' },
    { id: 'client-9', name: 'Manuel Gastélum Rivas', email: 'manuel.gastelum@email.com' },
    { id: 'client-10', name: 'Raúl Castañeda Peña', email: 'raul.castaneda@email.com' },
    { id: 'client-11', name: 'Óscar Barraza Medina', email: 'oscar.barraza@email.com' },
    { id: 'client-12', name: 'Javier Zamora Ochoa', email: 'javier.zamora@email.com' },
    { id: 'client-13', name: 'Emilio Aguilar Lizárraga', email: 'emilio.aguilar@email.com' },
    { id: 'client-14', name: 'Adrián Molina Esquer', email: 'adrian.molina@email.com' }
];

/* Clientes no registrados: la cita solo guarda el nombre. */
const GUESTS = ['Ernesto Villa', 'Mauricio Soto', 'Ramón Acosta', 'Teresa Duarte'];

const CANCELLATION_REASONS = [
    'El cliente avisó que no podrá asistir.',
    'Cambio de planes del cliente.',
    'El barbero no estará disponible ese día.',
    'Cita duplicada.',
    'El cliente no respondió la confirmación.'
];

const NOTES = [
    'Prefiere la máquina en el número 2.',
    'Primera vez en la sucursal.',
    'Viene con su hijo.',
    'Pidió atención con puntualidad.'
];

/* ---------- Generación determinista ---------- */

const TOTAL_APPOINTMENTS = 96;
/* Rango de días (respecto a hoy) en que se reparten las citas: algunas quedan fuera de los 60 días por defecto. */
const MIN_DAY_OFFSET = -78;
const MAX_DAY_OFFSET = 21;
/* México (Mazatlán) no usa horario de verano: UTC-7 todo el año. */
const BUSINESS_UTC_OFFSET = '-07:00';

/* Generador pseudoaleatorio con semilla: siempre produce la misma secuencia. */
const createRandom = (seed: number) => {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const pad = (value: number) => String(value).padStart(2, '0');

/* Fecha YYYY-MM-DD + minutos desde medianoche (hora del negocio) -> instante ISO UTC. */
const toInstant = (isoDate: string, minutesFromMidnight: number): string =>
    new Date(
        `${isoDate}T${pad(Math.floor(minutesFromMidnight / 60))}:${pad(minutesFromMidnight % 60)}:00${BUSINESS_UTC_OFFSET}`
    ).toISOString();

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

function buildAppointments(): AppointmentRecord[] {
    const random = createRandom(20261021);
    const randomInt = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
    const pick = <T>(items: T[]): T => items[randomInt(0, items.length - 1)];

    const today = getTodayIso();
    const nowMs = Date.now();

    return Array.from({ length: TOTAL_APPOINTMENTS }, (_, index) => {
        /* Fecha y hora de la cita (sin domingos, que son inhábiles). */
        let date = shiftIsoDate(today, randomInt(MIN_DAY_OFFSET, MAX_DAY_OFFSET));
        if (new Date(`${date}T12:00:00`).getDay() === 0) date = shiftIsoDate(date, 1);
        const startMinutes = 9 * 60 + randomInt(0, 19) * 30;

        /* Servicios: 1 (60%), 2 (30%) o 3 (10%), sin repetir. */
        const roll = random();
        const serviceCount = roll < 0.6 ? 1 : roll < 0.9 ? 2 : 3;
        const chosen = [...SERVICES].sort(() => random() - 0.5).slice(0, serviceCount);
        const services: AppointmentServiceItem[] = chosen.map((service) => ({
            serviceId: service.id,
            name: service.name,
            priceAtBooking: service.price,
            durationMinutesAtBooking: service.duration
        }));
        const durationMinutes = chosen.reduce((sum, service) => sum + service.duration, 0);

        /* Estado: 55% agendada, 23% reagendada, 22% cancelada. */
        const statusRoll = random();
        const status: AppointmentStatus =
            statusRoll < 0.55 ? 'scheduled' : statusRoll < 0.78 ? 'rescheduled' : 'cancelled';

        const scheduledStart = toInstant(date, startMinutes);
        const scheduledEnd = toInstant(date, startMinutes + durationMinutes);

        /* Las reagendadas conservan la fecha original (anterior a la actual). */
        const originalScheduledStart =
            status === 'rescheduled' ? toInstant(shiftIsoDate(date, -randomInt(1, 9)), startMinutes) : null;

        /* Se creó entre 1 y 14 días antes de la fecha de referencia, y nunca en el futuro. */
        const referenceMs = new Date(originalScheduledStart ?? scheduledStart).getTime();
        const createdMs = Math.min(
            referenceMs - randomInt(1, 14) * DAY_MS - randomInt(0, 8) * HOUR_MS,
            nowMs - HOUR_MS
        );
        const updatedMs =
            status === 'scheduled' ? createdMs : Math.min(createdMs + randomInt(1, 5) * DAY_MS, nowMs - HOUR_MS / 2);

        /* Cliente registrado (80%) o invitado (20%). */
        const isRegisteredClient = random() < 0.8;
        const client = isRegisteredClient ? pick(CLIENTS) : null;
        const barber = pick(BARBERS);
        const shop = SHOPS.find((candidate) => candidate.id === barber.shopId) ?? SHOPS[0];

        return {
            id: `apt-${String(index + 1).padStart(3, '0')}`,
            shopId: shop.id,
            shopName: shop.name,
            barberId: barber.id,
            barberName: barber.name,
            clientId: client?.id ?? null,
            isRegisteredClient,
            clientName: client?.name ?? pick(GUESTS),
            clientEmail: client?.email ?? null,
            status,
            scheduledStart,
            scheduledEnd,
            originalScheduledStart,
            cancelledAt: status === 'cancelled' ? new Date(updatedMs).toISOString() : null,
            cancellationReason: status === 'cancelled' ? pick(CANCELLATION_REASONS) : null,
            notes: random() < 0.25 ? pick(NOTES) : null,
            services,
            createdAt: new Date(createdMs).toISOString(),
            updatedAt: new Date(updatedMs).toISOString(),
            checkedInAt: null,
            completedAt: null,
        };
    });
}

const wait = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* Sucursal "asignada" a la recepcionista en el mock (el backend la toma de su perfil). */
const MOCK_RECEPTIONIST_SHOP_ID = 'shop-1';

/* Manager: citas de todas sus sucursales. Recepcionista: solo las de su sucursal asignada. */
export async function mockListAppointments(role?: string): Promise<AppointmentRecord[]> {
    await wait();
    const appointments = buildAppointments();
    return role === 'receptionist'
        ? appointments.filter((appointment) => appointment.shopId === MOCK_RECEPTIONIST_SHOP_ID)
        : appointments;
}
