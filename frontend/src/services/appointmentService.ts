import { apiClient } from './apiClient';
import type { Barber } from '../types/barber';
import type { AppointmentRecord, AppointmentStatus } from '../types/appointmentType';
import { getShops, getActiveBarbersByShop, getOfferedServices } from './shopService';

const DAY_MS = 24 * 60 * 60 * 1000;

/* ---------- Tipos de la API ---------- */

interface AppointmentClientApi {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    completedServicesCount: number;
}

/* Coincide con ClientAppointmentResponse / AppointmentResponse del backend (types/dto/appointmentResponse.interface.ts).
   Los campos de cliente solo los recibe el personal; el cliente recibe únicamente sus propias citas, sin ellos. */
interface AppointmentApi {
    id: string;
    shopId: string;
    barberId: string;
    client?: AppointmentClientApi | null;
    isRegisteredClient?: boolean;
    guestClientName?: string | null;
    status: string;
    scheduledStart: string;
    scheduledEnd: string;
    notes: string | null;
    services: { serviceId: string; priceAtBooking: number; durationMinutesAtBooking: number }[];
    createdAt: string;
    updatedAt: string;
}

export interface AppointmentClientInfo {
    id: string;
    name: string;
    email: string | null;
}

export interface DateRange {
    from: Date;
    to: Date;
}

/* ---------- Utilidades ---------- */

const STATUS_MAP: Record<string, AppointmentStatus> = {
    scheduled: 'scheduled',
    rescheduled: 'rescheduled',
    checked_in: 'checkedIn',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'noShow'
};

const authHeaders = (token: string): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } });

/* El backend limita el rango a 366 días; por defecto: 60 atrás y 180 adelante. */
const defaultRange = (): DateRange => ({
    from: new Date(Date.now() - 60 * DAY_MS),
    to: new Date(Date.now() + 180 * DAY_MS)
});

/* ---------- Catálogos (nombres) ---------- */

interface Catalogs {
    shops: Map<string, string>;
    barbers: Map<string, string>;
    services: Map<string, string>;
}

const barberFullName = (b: Barber) => `${b.firstName} ${b.lastName}`.trim();

/* Si un catálogo falla (o la entidad ya no está activa), la cita se muestra igual con un nombre genérico. */
async function loadCatalogs(token: string, shopIds: string[]): Promise<Catalogs> {
    const [shopsResult, servicesResult, ...barbersResults] = await Promise.allSettled([
        getShops(),
        getOfferedServices(token),
        ...shopIds.map((id) => getActiveBarbersByShop(id))
    ]);

    const shops = new Map<string, string>();
    if (shopsResult.status === 'fulfilled') {
        (shopsResult.value as { id: string; name: string }[]).forEach((s) => shops.set(s.id, s.name));
    }

    const services = new Map<string, string>();
    if (servicesResult.status === 'fulfilled') {
        (servicesResult.value as { id: string; name: string }[]).forEach((s) => services.set(s.id, s.name));
    }

    const barbers = new Map<string, string>();
    barbersResults.forEach((result) => {
        if (result.status === 'fulfilled') {
            (result.value as Barber[]).forEach((b) => barbers.set(b.id, barberFullName(b)));
        }
    });

    return { shops, barbers, services };
}

/* ---------- Mapper ---------- */

/* Quién es el cliente de la cita: el personal lo recibe del backend; en la vista del cliente es el usuario en sesión. */
function resolveClient(
    a: AppointmentApi,
    own?: AppointmentClientInfo
): Pick<AppointmentRecord, 'clientId' | 'isRegisteredClient' | 'clientName' | 'clientEmail'> {
    if (own) {
        return { clientId: own.id, isRegisteredClient: true, clientName: own.name, clientEmail: own.email };
    }
    if (a.client) {
        return {
            clientId: a.client.id,
            isRegisteredClient: true,
            clientName: `${a.client.firstName} ${a.client.lastName}`.trim(),
            clientEmail: a.client.email
        };
    }
    return {
        clientId: null,
        isRegisteredClient: false,
        clientName: a.guestClientName ?? 'Cliente',
        clientEmail: null
    };
}

function toRecord(a: AppointmentApi, catalogs: Catalogs, client?: AppointmentClientInfo): AppointmentRecord {
    return {
        id: a.id,
        shopId: a.shopId,
        shopName: catalogs.shops.get(a.shopId) ?? 'Sucursal',
        barberId: a.barberId,
        barberName: catalogs.barbers.get(a.barberId) ?? 'Barbero',
        ...resolveClient(a, client),
        status: STATUS_MAP[a.status] ?? 'scheduled',
        scheduledStart: a.scheduledStart,
        scheduledEnd: a.scheduledEnd,
        // El backend no tiene "reagendada" ni estos datos todavía.
        originalScheduledStart: null,
        cancelledAt: null,
        cancellationReason: null,
        notes: a.notes,
        services: a.services.map((s) => ({
            serviceId: s.serviceId,
            name: catalogs.services.get(s.serviceId) ?? 'Servicio',
            // Postgres puede entregar NUMERIC como texto.
            priceAtBooking: Number(s.priceAtBooking),
            durationMinutesAtBooking: Number(s.durationMinutesAtBooking)
        })),
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
    };
}

async function fetchRecords(
    token: string,
    range: DateRange,
    client?: AppointmentClientInfo
): Promise<AppointmentRecord[]> {
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
    const { data } = await apiClient.get<AppointmentApi[]>(`/appointments?${params}`, authHeaders(token));

    const shopIds = [...new Set(data.map((a) => a.shopId))];
    const catalogs = await loadCatalogs(token, shopIds);
    return data.map((a) => toRecord(a, catalogs, client));
}

/* ---------- Consultas (solo lectura) ---------- */

/* Vista del personal. El alcance (recepción: su sucursal; manager: sus sucursales) lo resuelve el backend con el token.
   `_role` se conserva solo para no romper las llamadas actuales; ya no se usa. */
export const getAppointments = async (
    token: string,
    _role?: string,
    range: DateRange = defaultRange()
): Promise<AppointmentRecord[]> => fetchRecords(token, range);

/* Vista del cliente: el backend devuelve solo sus citas. */
export const getMyAppointments = async (
    token: string,
    client: AppointmentClientInfo,
    range: DateRange = defaultRange()
): Promise<AppointmentRecord[]> => fetchRecords(token, range, client);

export const getAppointmentById = async (
    token: string,
    appointmentId: string,
    client?: AppointmentClientInfo,
    range: DateRange = defaultRange()
): Promise<AppointmentRecord | null> => {
    const records = await fetchRecords(token, range, client);
    return records.find((a) => a.id === appointmentId) ?? null;
};
