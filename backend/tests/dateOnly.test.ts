import { types } from 'pg';
// Importar la conexión registra los type parsers de pg (no abre ninguna conexión)
import '../src/connection/connection.js';
import { dateOnlySchema, calculateAgeFromDateOnly } from '../src/utils/dateOnly.js';

/* Estas pruebas no necesitan base de datos: verifican que una fecha de calendario
   (birth_date, columna DATE) se trate como 'YYYY-MM-DD' sin importar la zona horaria. */

const TIMEZONES = ['UTC', 'America/Mexico_City', 'America/Los_Angeles', 'Pacific/Auckland', 'Pacific/Kiritimati'];
const originalTZ = process.env.TZ;

afterAll(() => {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
});

describe('Parser de pg para columnas DATE', () => {
    test.each(TIMEZONES)('devuelve el string YYYY-MM-DD sin cambios con TZ=%s', (tz) => {
        process.env.TZ = tz;
        const parseDate = types.getTypeParser(types.builtins.DATE) as (value: string) => unknown;

        expect(parseDate('1990-01-01')).toBe('1990-01-01');
        expect(parseDate('2004-12-31')).toBe('2004-12-31');
    });

    test('no devuelve un objeto Date (que al serializarse a JSON sería un instante UTC)', () => {
        const parseDate = types.getTypeParser(types.builtins.DATE) as (value: string) => unknown;
        expect(typeof parseDate('1990-01-01')).toBe('string');
    });
});

describe('dateOnlySchema', () => {
    test.each(TIMEZONES)('conserva el mismo día con TZ=%s', (tz) => {
        process.env.TZ = tz;

        expect(dateOnlySchema.parse('1990-01-01')).toBe('1990-01-01');
        expect(dateOnlySchema.parse('2000-02-29')).toBe('2000-02-29');
        expect(dateOnlySchema.parse('1999-12-31')).toBe('1999-12-31');
    });

    test('devuelve un string, no un Date', () => {
        expect(typeof dateOnlySchema.parse('1990-01-01')).toBe('string');
    });

    test('descarta la hora de un datetime SIN zona (compatibilidad con Android antiguo)', () => {
        expect(dateOnlySchema.parse('1990-01-01T12:00:00')).toBe('1990-01-01');
        expect(dateOnlySchema.parse('1990-01-01T00:00:00.000')).toBe('1990-01-01');
    });

    test.each([
        ['un instante UTC con Z', '1990-01-01T00:00:00.000Z'],
        ['un instante con offset', '1990-01-01T00:00:00-06:00'],
        ['un día inexistente', '1990-02-30'],
        ['un 29 de febrero en año no bisiesto', '1999-02-29'],
        ['un mes inválido', '1990-13-01'],
        ['formato dd/mm/aaaa', '01/01/1990'],
        ['texto libre', 'no-es-fecha'],
        ['cadena vacía', ''],
    ])('rechaza %s', (_label, value) => {
        expect(dateOnlySchema.safeParse(value).success).toBe(false);
    });

    test('rechaza valores que no son string', () => {
        expect(dateOnlySchema.safeParse(631152000000).success).toBe(false);
        expect(dateOnlySchema.safeParse(new Date('1990-01-01')).success).toBe(false);
    });
});

describe('calculateAgeFromDateOnly', () => {
    test.each(TIMEZONES)('calcula la edad por día de calendario con TZ=%s', (tz) => {
        process.env.TZ = tz;
        const today = new Date(2026, 5, 15); // 15 jun 2026, hora local

        expect(calculateAgeFromDateOnly('2000-06-15', today)).toBe(26); // cumple hoy
        expect(calculateAgeFromDateOnly('2000-06-16', today)).toBe(25); // cumple mañana
        expect(calculateAgeFromDateOnly('2000-06-14', today)).toBe(26); // cumplió ayer
        expect(calculateAgeFromDateOnly('2000-01-01', today)).toBe(26);
        expect(calculateAgeFromDateOnly('2000-12-31', today)).toBe(25);
    });
});
