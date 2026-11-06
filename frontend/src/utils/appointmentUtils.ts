import type { SelectOption } from '../components/common/SelectFieldComponent';
import type {
    AppointmentFilterValues,
    AppointmentRecord,
    AppointmentStatus,
    SortDirection
} from '../types/appointmentType';
import type { AppointmentQuery } from '../services/appointmentService';
import { displayToIsoDate, isValidDisplayDate } from './dateFormat';
import { matchesQuery } from './listUtils';

/* Zona horaria del negocio (la misma que usa el backend). Las fechas y horas de las citas se
   muestran y se comparan siempre en esta zona, sin importar la del navegador. */
export const BUSINESS_TIMEZONE = 'America/Mazatlan';

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

/* Valores iniciales de los filtros: sin fechas (el backend aplica su ventana por defecto), todas las sucursales,
   servicios y estados. */
export const getDefaultFilters = (): AppointmentFilterValues => ({
    serviceFrom: '',
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

/* ---------- Consulta al backend ---------- */

/* El backend rechaza rangos de más de 366 días: máximo 366 días entre la fecha inicial y la final, inclusive. */
export const MAX_RANGE_DAYS = 366;

/* Desfase (ms) de la zona del negocio respecto a UTC en un instante dado (negativo al oeste de UTC). */
const businessOffsetMs = (utcMs: number): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIMEZONE,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    }).formatToParts(new Date(utcMs));
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);

    const wallMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return wallMs - Math.floor(utcMs / 1000) * 1000;
};

/* YYYY-MM-DD -> instante en que empieza ese día en la zona del negocio. */
const businessDayStart = (isoDate: string): Date => {
    const [year, month, day] = isoDate.split('-').map(Number);
    const wallMs = Date.UTC(year, month - 1, day);
    // Dos pasadas: el desfase se evalúa en el instante resultante por si cambia (horario de verano).
    const firstGuess = wallMs - businessOffsetMs(wallMs);
    return new Date(wallMs - businessOffsetMs(firstGuess));
};

/* Rango [inicio del día `from`, fin del día `to`] en la zona del negocio (to inclusivo). */
const businessDayRange = (fromIso: string, toIso: string): { from: Date; to: Date } => ({
    from: businessDayStart(fromIso),
    to: new Date(businessDayStart(shiftIsoDate(toIso, 1)).getTime() - 1)
});

/* Último día agendable: hoy + 30 (igual que MAX_BOOKING_DAYS_AHEAD del backend). */
const BOOKING_DAYS_AHEAD = 30;

/* Rango para la vista del cliente: del pasado más lejano que acepta el backend hasta el último día agendable,
   para que las pestañas "Pasadas" y "Canceladas" tengan citas. Hoy y los días se cuentan en la zona del negocio. */
export const getClientAppointmentsRange = (): { from: Date; to: Date } => {
    const today = toBusinessDate(new Date().toISOString());
    const daysBack = MAX_RANGE_DAYS - 1 - BOOKING_DAYS_AHEAD;
    return businessDayRange(shiftIsoDate(today, -daysBack), shiftIsoDate(today, BOOKING_DAYS_AHEAD));
};

/* Filtros que se resuelven en el backend: fecha de servicio, sucursal (solo manager) y estado.
   El resto (búsqueda, servicio, fecha de creación) se aplica sobre lo ya cargado.
   Sin fechas no se envía rango y el backend usa su ventana por defecto. Con solo una fecha, la otra se completa
   al máximo que acepta el backend, de modo que "sin límite" no quede recortado por esa ventana.
   Regresa null si una fecha está incompleta o el rango no es válido. */
export const toAppointmentQuery = (filters: AppointmentFilterValues, includeShop: boolean): AppointmentQuery | null => {
    if (filters.serviceFrom !== '' && !isValidDisplayDate(filters.serviceFrom)) return null;
    if (filters.serviceTo !== '' && !isValidDisplayDate(filters.serviceTo)) return null;

    let from = displayToIsoDate(filters.serviceFrom);
    let to = displayToIsoDate(filters.serviceTo);

    if (from && to && (to < from || to > shiftIsoDate(from, MAX_RANGE_DAYS - 1))) return null;
    if (from && !to) to = shiftIsoDate(from, MAX_RANGE_DAYS - 1);
    if (to && !from) from = shiftIsoDate(to, -(MAX_RANGE_DAYS - 1));

    return {
        range: from && to ? businessDayRange(from, to) : undefined,
        shopId: includeShop && filters.shopId !== 'all' ? filters.shopId : undefined,
        status: filters.status !== 'all' ? (filters.status as AppointmentStatus) : undefined
    };
};

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

/* Catálogos id -> nombre para las opciones de los filtros. Como la sucursal y el estado se filtran en el
   backend, las citas cargadas ya no incluyen las demás sucursales; por eso los catálogos se acumulan entre
   consultas y las opciones no desaparecen al elegir una. */
export type LabelCatalog = ReadonlyMap<string, string>;

export const collectShopLabels = (appointments: AppointmentRecord[]): [string, string][] =>
    appointments.map((appointment) => [appointment.shopId, appointment.shopName]);

export const collectServiceLabels = (appointments: AppointmentRecord[]): [string, string][] =>
    appointments.flatMap((appointment) =>
        appointment.services.map((service): [string, string] => [service.serviceId, service.name])
    );

/* Agrega entradas a un catálogo. Devuelve el mismo objeto si no hay nada nuevo (evita renders de más). */
export const mergeCatalog = (catalog: LabelCatalog, entries: [string, string][]): LabelCatalog => {
    if (entries.every(([id, label]) => catalog.get(id) === label)) return catalog;
    return new Map([...catalog, ...entries]);
};

const buildOptions = (catalog: LabelCatalog, allLabel: string): SelectOption[] => {
    const options = [...catalog.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));

    return [{ value: 'all', label: allLabel }, ...options];
};

/* Con una sola sucursal (p. ej. recepción, que solo ve la suya) el filtro no aporta y no se muestra. */
export const buildShopOptions = (catalog: LabelCatalog): SelectOption[] =>
    buildOptions(catalog, 'Todas las sucursales');

export const buildServiceOptions = (catalog: LabelCatalog): SelectOption[] =>
    buildOptions(catalog, 'Todos los servicios');

/* Cantidad de filtros del panel distintos de su valor por defecto (la búsqueda no cuenta: está fuera del panel). */
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
