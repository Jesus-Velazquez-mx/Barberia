import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getServicesByIds } from '../repositories/offeredServiceRepository.js';
import { getShopById } from '../repositories/shopRepository.js';
import { getActiveBarbersByShop } from '../repositories/barberRepository.js';
import { getBlockingAppointmentsByBarberIdsAndRange } from '../repositories/appointmentRepository.js';
import { getAllShifts } from '../repositories/shiftRepository.js';
import type { OfferedService } from '../types/entities/offeredService.interface.js';
import { timeToMinutes, toBusinessWallClockMs } from '../utils/businessTime.js';

/** Máximo de días de anticipación con los que se puede consultar/agendar. */
export const MAX_BOOKING_DAYS_AHEAD = 30;

/** Días de la semana en que las sucursales abren (0 = domingo, igual que en la BD). Todas cierran domingo. */
export const OPEN_DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6];

/** Separación entre horarios de inicio candidatos dentro de cada hueco libre. */
export const SLOT_STEP_MINUTES = 15;

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

export interface GetAvailableSlotsInput {
    shopId: string;
    /** Fecha en formato YYYY-MM-DD, interpretada en UTC. */
    date: string;
    /** Servicios de la cita; los horarios se calculan con la suma de sus duraciones. */
    serviceIds: string[];
}

export interface AvailableSlotsByBarber {
    barberId: string;
    /** Horarios de inicio agendables en ISO 8601 UTC. */
    startTimes: string[];
}

/** Intervalo semiabierto [start, end) en minutos desde la medianoche UTC de la fecha. */
export type Interval = [number, number];

/**
 * Lógica pura: a cada ventana le resta los intervalos ocupados y divide cada hueco libre
 * desde su propio inicio en pasos de `step`, conservando los inicios cuyo
 * [start, start + duration) cabe en el hueco y no son anteriores a `notBefore`.
 * Después de una cita, los horarios arrancan justo donde ésta termina.
 */
export const computeStartMinutes = (
    windows: Interval[],
    busy: Interval[],
    duration: number,
    notBefore = -Infinity,
    step = SLOT_STEP_MINUTES
): number[] => {
    const sortedBusy = [...busy].sort((a, b) => a[0] - b[0]);
    const starts: number[] = [];
    for (const [winStart, winEnd] of windows) {
        let cursor = winStart;
        // El centinela [winEnd, winEnd] cierra el último hueco de la ventana.
        for (const [busyStart, busyEnd] of [...sortedBusy, [winEnd, winEnd]]) {
            const gapEnd = Math.min(busyStart, winEnd);
            for (let s = cursor; s + duration <= gapEnd; s += step) {
                if (s >= notBefore) starts.push(s);
            }
            cursor = Math.max(cursor, busyEnd);
            if (cursor >= winEnd) break;
        }
    }
    return [...new Set(starts)].sort((a, b) => a - b);
};

/** Valida 'YYYY-MM-DD' y devuelve la medianoche UTC de esa fecha en ms. */
const parseDate = (date: string): number => {
    const ms = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T00:00:00Z`) : NaN;
    if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date) {
        throw new ApiError(ApiErrorCode.INVALID_INPUT, 'Invalid date, expected YYYY-MM-DD');
    }
    return ms;
};

/**
 * Devuelve los servicios pedidos, o lanza 404 si alguno no existe o está inactivo.
 */
export const getBookableServices = async (serviceIds: string[]): Promise<OfferedService[]> => {
    const services = await getServicesByIds(serviceIds);
    if (services.length !== new Set(serviceIds).size || services.some((s) => !s.is_active)) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found or is inactive');
    }
    return services;
};

/**
 * Calcula, por barbero elegible de la sucursal, los horarios de inicio agendables para
 * los servicios en la fecha dada (duración = suma de sus duraciones): ventana del turno
 * del barbero (si la sucursal abre ese día), menos las citas scheduled / checked_in, con
 * cada hueco libre dividido en pasos de SLOT_STEP_MINUTES.
 * Fechas y horarios se manejan como hora de pared "en UTC"; solo "hoy" y "ahora" se
 * calculan en la zona horaria del negocio (BUSINESS_TIMEZONE).
 */
export const getAvailableSlots = async ({
    shopId,
    date,
    serviceIds,
}: GetAvailableSlotsInput): Promise<AvailableSlotsByBarber[]> => {
    const dayStart = parseDate(date);
    // "Ahora" en hora de pared del negocio (BUSINESS_TIMEZONE), no del servidor.
    const now = toBusinessWallClockMs();
    const todayStart = now - (now % MS_PER_DAY);

    if (dayStart < todayStart) {
        throw new ApiError(ApiErrorCode.INVALID_INPUT, 'La fecha no puede estar en pasado');
    }
    if (dayStart > todayStart + MAX_BOOKING_DAYS_AHEAD * MS_PER_DAY) {
        throw new ApiError(ApiErrorCode.INVALID_INPUT, `Date cannot be more than ${MAX_BOOKING_DAYS_AHEAD} days ahead`);
    }

    const services = await getBookableServices(serviceIds);
    const duration = services.reduce((sum, s) => sum + s.duration_minutes, 0);

    const shop = await getShopById(shopId);
    if (!shop || !shop.is_active) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found or is inactive');
    }

    const barbers = await getActiveBarbersByShop(shopId);
    if (barbers.length === 0) return [];

    const barberIds: string[] = barbers.map((b: { id: string }) => b.id);
    const dayOfWeek = new Date(dayStart).getUTCDay(); // 0 = domingo, igual que la BD

    // Ninguna sucursal abre en domingo: ningún barbero tiene horarios ese día.
    if (!OPEN_DAYS_OF_WEEK.includes(dayOfWeek)) {
        return barbers.map((barber: { id: string }) => ({ barberId: barber.id, startTimes: [] }));
    }

    const [appointments, shifts] = await Promise.all([
        getBlockingAppointmentsByBarberIdsAndRange(barberIds, new Date(dayStart), new Date(dayStart + MS_PER_DAY)),
        getAllShifts(),
    ]);

    const toMinutes = (d: Date) => (new Date(d).getTime() - dayStart) / MS_PER_MINUTE;
    // Hoy no se ofrecen inicios que ya pasaron.
    const notBefore = dayStart === todayStart ? (now - dayStart) / MS_PER_MINUTE : -Infinity;

    return barbers.map((barber: { id: string; shift_id: string }) => {
        const shift = shifts.find((s) => s.id === barber.shift_id);
        const windows: Interval[] = shift ? [[timeToMinutes(shift.start_time), timeToMinutes(shift.end_time)]] : [];

        const busy = appointments
            .filter((a) => a.barber_id === barber.id)
            .map((a): Interval => [toMinutes(a.scheduled_start), toMinutes(a.scheduled_end)]);

        return {
            barberId: barber.id,
            startTimes: computeStartMinutes(windows, busy, duration, notBefore).map((m) =>
                new Date(dayStart + m * MS_PER_MINUTE).toISOString()
            ),
        };
    });
};
