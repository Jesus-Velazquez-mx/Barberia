import { z } from 'zod';

/* Una fecha de calendario (p. ej. birth_date, columna DATE) no tiene hora ni zona horaria.
   Se maneja siempre como string 'YYYY-MM-DD' para evitar corrimientos de día al convertir
   a/desde Date (que siempre implica un instante y una zona). */

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:T[\d:.]*)?$/;

const isRealCalendarDate = (year: number, month: number, day: number): boolean => {
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
};

/**
 * Acepta 'YYYY-MM-DD'. Por compatibilidad con clientes que envían 'YYYY-MM-DDTHH:mm:ss' SIN zona
 * (p. ej. Android), descarta la parte de hora. Cualquier otro formato (incluido uno con 'Z' u
 * offset, que sí representa un instante) se rechaza. Devuelve el string 'YYYY-MM-DD'.
 */
export const dateOnlySchema = z
    .string()
    .trim()
    .transform((value, ctx) => {
        const match = DATE_ONLY_REGEX.exec(value);
        if (!match || !isRealCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]))) {
            ctx.addIssue({ code: 'custom', message: 'Format must be YYYY-MM-DD' });
            return z.NEVER;
        }
        return `${match[1]}-${match[2]}-${match[3]}`;
    });

/** Edad en años cumplidos a partir de 'YYYY-MM-DD', comparando contra la fecha local de hoy. */
export const calculateAgeFromDateOnly = (birthDate: string, today = new Date()): number => {
    const [year, month, day] = birthDate.slice(0, 10).split('-').map(Number);
    let age = today.getFullYear() - year;
    const birthdayHasOccurred =
        today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!birthdayHasOccurred) age -= 1;
    return age;
};
