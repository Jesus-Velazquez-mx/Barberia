import type { SelectOption } from '../components/SelectFieldComponent';
import type {
    AppointmentFilterValues,
    AppointmentRecord,
    AppointmentStatus,
    SortDirection
} from '../types/appointmentType';
import { displayToIsoDate, getTodayIso, isoToDisplayDate } from './dateFormat';
import { matchesQuery } from './listUtils';

/* Zona horaria del negocio (la misma que usa el backend). Las fechas y horas de las citas se
   muestran y se comparan siempre en esta zona, sin importar la del navegador. */
export const BUSINESS_TIMEZONE = 'America/Mazatlan';

/* Días hacia atrás que se muestran por defecto en el filtro de fecha de servicio. */
export const DEFAULT_DAYS_BACK = 60;

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
    scheduled: 'Agendada',
    rescheduled: 'Reagendada',
    checkedIn: 'Iniciada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    noShow: 'Ausencia'
};

export const STATUS_OPTIONS: SelectOption[] = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'scheduled', label: STATUS_LABELS.scheduled },
    { value: 'rescheduled', label: STATUS_LABELS.rescheduled },
    { value: 'checkedIn', label: STATUS_LABELS.checkedIn },
    { value: 'completed', label: STATUS_LABELS.completed },
    { value: 'cancelled', label: STATUS_LABELS.cancelled },
    { value: 'noShow', label: STATUS_LABELS.noShow }
];

/* ---------- Fechas ---------- */

/* Suma (o resta) días a una fecha YYYY-MM-DD. Se calcula a mediodía para evitar saltos por horario de verano. */
export const shiftIsoDate = (isoDate: string, days: number): string => {
    const date = new Date(`${isoDate}T12:00:00`);
    date.setDate(date.getDate() + days);

    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/* Valores iniciales de los filtros: citas de los últimos 60 días en adelante, todos los servicios y estados. */
export const getDefaultFilters = (): AppointmentFilterValues => ({
    serviceFrom: isoToDisplayDate(shiftIsoDate(getTodayIso(), -DEFAULT_DAYS_BACK)),
    serviceTo: '',
    createdFrom: '',
    createdTo: '',
    shopId: 'all',
    serviceId: 'all',
    status: 'all'
});

/* Instante ISO -> fecha YYYY-MM-DD en la zona del negocio. */
export const toBusinessDate = (isoDateTime: string): string =>
    new Date(isoDateTime).toLocaleDateString('en-CA', { timeZone: BUSINESS_TIMEZONE });

/* "2026-10-21T16:00:00.000Z" -> "21 oct 2026" */
export const formatAppointmentDate = (isoDateTime: string): string =>
    new Date(isoDateTime)
        .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: BUSINESS_TIMEZONE })
        .replace(/\./g, '');

/* "2026-10-21T16:00:00.000Z" -> "09:00" */
export const formatAppointmentTime = (isoDateTime: string): string =>
    new Date(isoDateTime).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: BUSINESS_TIMEZONE
    });

export const formatAppointmentDateTime = (isoDateTime: string): string =>
    `${formatAppointmentDate(isoDateTime)}, ${formatAppointmentTime(isoDateTime)}`;

export const formatPrice = (amount: number): string =>
    amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

/* ---------- Totales de una cita ---------- */

export const getAppointmentTotal = (appointment: AppointmentRecord): number =>
    appointment.services.reduce((sum, service) => sum + service.priceAtBooking, 0);

export const getAppointmentDuration = (appointment: AppointmentRecord): number =>
    appointment.services.reduce((sum, service) => sum + service.durationMinutesAtBooking, 0);

/* ---------- Filtros y orden ---------- */

/* Límites inclusivos en YYYY-MM-DD; '' = sin límite. */
const isWithinRange = (isoDate: string, from: string, to: string): boolean =>
    (!from || isoDate >= from) && (!to || isoDate <= to);

/* Aplica búsqueda por cliente (nombre o correo, sin acentos) y los filtros del formulario.
   Una fecha incompleta o inválida se ignora hasta que quede completa. */
export function filterAppointments(
    appointments: AppointmentRecord[],
    search: string,
    filters: AppointmentFilterValues
): AppointmentRecord[] {
    const serviceFrom = displayToIsoDate(filters.serviceFrom);
    const serviceTo = displayToIsoDate(filters.serviceTo);
    const createdFrom = displayToIsoDate(filters.createdFrom);
    const createdTo = displayToIsoDate(filters.createdTo);

    return appointments.filter(
        (appointment) =>
            matchesQuery([appointment.clientName, appointment.clientEmail], search) &&
            isWithinRange(toBusinessDate(appointment.scheduledStart), serviceFrom, serviceTo) &&
            isWithinRange(toBusinessDate(appointment.createdAt), createdFrom, createdTo) &&
            (filters.shopId === 'all' || appointment.shopId === filters.shopId) &&
            (filters.status === 'all' || appointment.status === filters.status) &&
            (filters.serviceId === 'all' ||
                appointment.services.some((service) => service.serviceId === filters.serviceId))
    );
}

/* Ordena por fecha de servicio. No modifica el arreglo original. */
export const sortByServiceDate = (appointments: AppointmentRecord[], direction: SortDirection): AppointmentRecord[] => {
    const factor = direction === 'asc' ? 1 : -1;

    return [...appointments].sort(
        (a, b) => factor * (new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
    );
};

/* Opciones del filtro de sucursal, tomadas de las sucursales que aparecen en las citas cargadas.
   Con una sola sucursal (p. ej. recepción, que solo ve la suya) el filtro no aporta y no se muestra. */
export function buildShopOptions(appointments: AppointmentRecord[]): SelectOption[] {
    const byId = new Map<string, string>();
    appointments.forEach((appointment) => byId.set(appointment.shopId, appointment.shopName));

    const options = [...byId.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));

    return [{ value: 'all', label: 'Todas las sucursales' }, ...options];
}

/* Opciones del filtro de servicio, tomadas de los servicios que aparecen en las citas cargadas. */
export function buildServiceOptions(appointments: AppointmentRecord[]): SelectOption[] {
    const byId = new Map<string, string>();
    appointments.forEach((appointment) =>
        appointment.services.forEach((service) => byId.set(service.serviceId, service.name))
    );

    const options = [...byId.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));

    return [{ value: 'all', label: 'Todos los servicios' }, ...options];
}

/* Cantidad de filtros del panel distintos de su valor por defecto (la búsqueda no cuenta: está fuera del panel).
   El rango de 60 días por defecto no cuenta como filtro activo. */
export const countActiveFilters = (filters: AppointmentFilterValues): number => {
    const defaults = getDefaultFilters();
    return (Object.keys(defaults) as (keyof AppointmentFilterValues)[]).filter((key) => filters[key] !== defaults[key])
        .length;
};

/* true si algún filtro difiere de los valores por defecto (o hay búsqueda). */
export const hasActiveFilters = (search: string, filters: AppointmentFilterValues): boolean => {
    const defaults = getDefaultFilters();
    return (
        search.trim() !== '' ||
        (Object.keys(defaults) as (keyof AppointmentFilterValues)[]).some((key) => filters[key] !== defaults[key])
    );
};
