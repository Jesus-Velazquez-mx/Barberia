import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getServiceById } from '../repositories/serviceRepository.js';
import { getShopById } from '../repositories/shopRepository.js';
import { getActiveBarbersByShop } from '../repositories/barberRepository.js';
import { getActiveSlotsByBarberIdsAndDay } from '../repositories/availabilitySlotRepository.js';
import { getBlockingAppointmentsByBarberIdsAndRange } from '../repositories/appointmentRepository.js';
import { getAllShifts } from '../repositories/shiftRepository.js';

/** Máximo de días de anticipación con los que se puede consultar/agendar. */
export const MAX_BOOKING_DAYS_AHEAD = 30;

/** Separación entre horarios de inicio candidatos dentro de cada hueco libre. */
export const SLOT_STEP_MINUTES = 15;

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

export interface GetAvailableSlotsInput {
    shopId: string;
    /** Fecha en formato YYYY-MM-DD, interpretada en UTC. */
    date: string;
    serviceId: string;
}

export interface AvailableSlotsByBarber {
    barberId: string;
    /** Horarios de inicio agendables en ISO 8601 UTC. */
    startTimes: string[];
}

/** Intervalo semiabierto [start, end) en minutos desde la medianoche UTC de la fecha. */
export type Interval = [number, number];

/** 'HH:MM[:SS]' (columna time de Postgres) -> minutos desde medianoche. */
const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

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
 * Calcula, por barbero elegible de la sucursal, los horarios de inicio agendables para
 * el servicio en la fecha dada: plantilla semanal acotada por el turno, menos las citas
 * scheduled / checked_in, con cada hueco libre dividido en pasos de SLOT_STEP_MINUTES.
 * Todo en UTC.
 */
export const getAvailableSlots = async ({
    shopId,
    date,
    serviceId,
}: GetAvailableSlotsInput): Promise<AvailableSlotsByBarber[]> => {
    const dayStart = parseDate(date);
    const now = Date.now();
    const todayStart = now - (now % MS_PER_DAY);

    if (dayStart < todayStart) {
        throw new ApiError(ApiErrorCode.INVALID_INPUT, 'Date cannot be in the past');
    }
    if (dayStart > todayStart + MAX_BOOKING_DAYS_AHEAD * MS_PER_DAY) {
        throw new ApiError(ApiErrorCode.INVALID_INPUT, `Date cannot be more than ${MAX_BOOKING_DAYS_AHEAD} days ahead`);
    }

    const service = await getServiceById(serviceId);
    if (!service || !service.is_active) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found or is inactive');
    }

    const shop = await getShopById(shopId);
    if (!shop || !shop.is_active) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found or is inactive');
    }

    const barbers = await getActiveBarbersByShop(shopId);
    if (barbers.length === 0) return [];

    const barberIds: string[] = barbers.map((b: { id: string }) => b.id);
    const dayOfWeek = new Date(dayStart).getUTCDay(); // 0 = domingo, igual que la BD

    const [slots, appointments, shifts] = await Promise.all([
        getActiveSlotsByBarberIdsAndDay(barberIds, dayOfWeek),
        getBlockingAppointmentsByBarberIdsAndRange(barberIds, new Date(dayStart), new Date(dayStart + MS_PER_DAY)),
        getAllShifts(),
    ]);

    const toMinutes = (d: Date) => (new Date(d).getTime() - dayStart) / MS_PER_MINUTE;
    // Hoy no se ofrecen inicios que ya pasaron.
    const notBefore = dayStart === todayStart ? (now - dayStart) / MS_PER_MINUTE : -Infinity;

    return barbers.map((barber: { id: string; shift_id: string }) => {
        const shift = shifts.find((s) => s.id === barber.shift_id);
        const shiftStart = shift ? timeToMinutes(shift.start_time) : 0;
        const shiftEnd = shift ? timeToMinutes(shift.end_time) : 0;

        const windows = slots
            .filter((s) => s.barber_id === barber.id && s.shop_id === shopId)
            .map((s): Interval => [
                Math.max(timeToMinutes(s.start_time), shiftStart),
                Math.min(timeToMinutes(s.end_time), shiftEnd),
            ])
            .filter(([start, end]) => start < end);

        const busy = appointments
            .filter((a) => a.barber_id === barber.id)
            .map((a): Interval => [toMinutes(a.scheduled_start), toMinutes(a.scheduled_end)]);

        return {
            barberId: barber.id,
            startTimes: computeStartMinutes(windows, busy, service.duration_minutes, notBefore).map((m) =>
                new Date(dayStart + m * MS_PER_MINUTE).toISOString()
            ),
        };
    });
};
