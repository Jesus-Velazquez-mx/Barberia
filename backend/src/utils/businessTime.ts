import globalConfig from "../config/globalConfig.js";

/** Zona horaria IANA en la que opera el negocio cuando BUSINESS_TIMEZONE no está definida. */
export const DEFAULT_BUSINESS_TIMEZONE = 'America/Mazatlan';

const formatters = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string): Intl.DateTimeFormat => {
    let formatter = formatters.get(timeZone);
    if (!formatter) {
        // Lanza RangeError si la zona no es válida: preferimos fallar fuerte a calcular mal "hoy".
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            hourCycle: 'h23',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        });
        formatters.set(timeZone, formatter);
    }
    return formatter;
};

/** Zona horaria del negocio (se lee en cada llamada para poder sobreescribirla en pruebas). */
export const getBusinessTimezone = (): string => globalConfig.BUSINESS_TIMEZONE || DEFAULT_BUSINESS_TIMEZONE;

/**
 * Hora de pared del negocio expresada como ms "en UTC": el resultado, leído con los
 * getters UTC, muestra la fecha y hora que marca el reloj en `timeZone`. Es la misma
 * convención que usa el servicio de disponibilidad (turnos y horarios como hora de pared).
 */
export const toBusinessWallClockMs = (utcMs: number = Date.now(), timeZone: string = getBusinessTimezone()): number => {
    const parts: Record<string, number> = {};
    for (const { type, value } of getFormatter(timeZone).formatToParts(new Date(utcMs))) {
        if (type !== 'literal') parts[type] = Number(value);
    }
    const millis = ((utcMs % 1000) + 1000) % 1000;
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, millis);
};

/** Fecha de hoy ('YYYY-MM-DD') en la zona horaria del negocio. */
export const getBusinessToday = (utcMs: number = Date.now(), timeZone: string = getBusinessTimezone()): string =>
    new Date(toBusinessWallClockMs(utcMs, timeZone)).toISOString().slice(0, 10);

/**
 * Instante real (UTC) en que empieza, a las 00:00 de la zona horaria del negocio, el día que está
 * `daysFromToday` días después de hoy (0 = hoy). Parte de la hora de pared deseada y le resta el
 * desfase de la zona; el desfase se vuelve a calcular una vez para acertar en zonas con horario de verano.
 */
export const getBusinessDayStart = (
    daysFromToday: number = 0,
    utcMs: number = Date.now(),
    timeZone: string = getBusinessTimezone()
): Date => {
    const todayWallMs = Date.parse(`${getBusinessToday(utcMs, timeZone)}T00:00:00.000Z`);
    const targetWallMs = todayWallMs + daysFromToday * 24 * 60 * 60 * 1000;

    let instantMs = targetWallMs;
    for (let i = 0; i < 2; i++) {
        instantMs = targetWallMs - (toBusinessWallClockMs(instantMs, timeZone) - instantMs);
    }
    return new Date(instantMs);
};
