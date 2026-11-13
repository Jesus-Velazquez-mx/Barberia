import { jest } from '@jest/globals';

// ESM: los mocks deben registrarse antes de importar dinámicamente el servicio.
const getServicesByIds = jest.fn<(...args: any[]) => Promise<any>>();
const getShopById = jest.fn<(...args: any[]) => Promise<any>>();
const getActiveBarbersByShop = jest.fn<(...args: any[]) => Promise<any>>();
const getBlockingAppointmentsByBarberIdsAndRange = jest.fn<(...args: any[]) => Promise<any>>();
const getAllShifts = jest.fn<(...args: any[]) => Promise<any>>();

// La zona horaria del negocio sale de globalConfig; el mock es mutable para fijarla por prueba.
const mockConfig: { BUSINESS_TIMEZONE?: string } = {};

jest.unstable_mockModule('../src/config/globalConfig.js', () => ({ default: mockConfig }));
jest.unstable_mockModule('../src/repositories/offeredServiceRepository.js', () => ({ getServicesByIds }));
jest.unstable_mockModule('../src/repositories/shopRepository.js', () => ({ getShopById }));
jest.unstable_mockModule('../src/repositories/barberRepository.js', () => ({ getActiveBarbersByShop }));
jest.unstable_mockModule('../src/repositories/appointmentRepository.js', () => ({
    getBlockingAppointmentsByBarberIdsAndRange,
}));
jest.unstable_mockModule('../src/repositories/shiftRepository.js', () => ({ getAllShifts }));

const { getAvailableSlots, getNextAvailableSlots, computeStartMinutes, MAX_BOOKING_DAYS_AHEAD } =
    await import('../src/services/availabilityService.js');
const { ApiError, ApiErrorCode } = await import('../src/errors/ApiError.js');
const { getBusinessToday, businessWallClockToUtcMs } = await import('../src/utils/businessTime.js');

const SHOP = 'shop-1';
const SERVICE = 'service-1';
const BARBER = 'barber-1';
const SHIFT = 'shift-1';

const DAY_MS = 86_400_000;
/** Suma `days` a una fecha 'YYYY-MM-DD' (calendario, sin zona horaria). */
const addDays = (date: string, days: number) =>
    new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
/** Primer día a partir de `date` (inclusive) cuyo día de la semana UTC sea `dayOfWeek`. */
const nextDayOfWeek = (date: string, dayOfWeek: number) => {
    let d = date;
    while (new Date(`${d}T00:00:00Z`).getUTCDay() !== dayOfWeek) d = addDays(d, 1);
    return d;
};
// "Hoy" es el de la zona horaria del negocio, igual que en el servicio.
// Se evita que caiga en domingo (cierre semanal) para que las pruebas con mocks de turno/citas no colapsen a [].
const tomorrowCandidate = addDays(getBusinessToday(), 1);
const TOMORROW =
    new Date(`${tomorrowCandidate}T00:00:00Z`).getUTCDay() === 0 ? addDays(tomorrowCandidate, 1) : tomorrowCandidate;
// `at` recibe la hora de pared del negocio (dígitos literales) y devuelve el instante UTC real
// correspondiente, igual que hace el servicio (businessWallClockToUtcMs), no el string "Z" literal.
const at = (hhmm: string, date = TOMORROW) => new Date(businessWallClockToUtcMs(Date.parse(`${date}T${hhmm}:00.000Z`)));
const iso = (hhmm: string) => at(hhmm).toISOString();
/** Inicios cada 15 min desde `first` hasta `last` (inclusive), en ISO. */
const every15 = (first: string, last: string) => {
    const out: string[] = [];
    for (let t = at(first).getTime(); t <= at(last).getTime(); t += 15 * 60_000) out.push(new Date(t).toISOString());
    return out;
};

const appt = (start: string, end: string, barberId = BARBER) => ({
    barber_id: barberId,
    scheduled_start: at(start),
    scheduled_end: at(end),
});

const run = () => getAvailableSlots({ shopId: SHOP, date: TOMORROW, serviceIds: [SERVICE] });

beforeEach(() => {
    jest.resetAllMocks();
    getServicesByIds.mockResolvedValue([{ id: SERVICE, duration_minutes: 60, is_active: true }]);
    getShopById.mockResolvedValue({ id: SHOP, is_active: true });
    getActiveBarbersByShop.mockResolvedValue([{ id: BARBER, shift_id: SHIFT }]);
    getAllShifts.mockResolvedValue([{ id: SHIFT, start_time: '09:00:00', end_time: '13:00:00' }]);
    getBlockingAppointmentsByBarberIdsAndRange.mockResolvedValue([]);
});

describe('computeStartMinutes (lógica pura)', () => {
    test('día libre: inicios cada 15 min cubriendo toda la ventana', () => {
        expect(computeStartMinutes([[540, 600]], [], 30)).toEqual([540, 555, 570]);
    });

    test('no ofrece un inicio cuyo fin se sale de la ventana', () => {
        expect(computeStartMinutes([[540, 630]], [], 60)).toEqual([540, 555, 570]);
    });

    test('tras una cita a mitad de ventana, los horarios arrancan donde termina', () => {
        // ventana 09:00-13:00, cita 10:00-10:30: hueco 09:00-10:00 y hueco 10:30-13:00
        expect(computeStartMinutes([[540, 780]], [[600, 630]], 60)).toEqual([540, 630, 645, 660, 675, 690, 705, 720]);
    });

    test('citas consecutivas sin hueco no dejan falso positivo', () => {
        expect(
            computeStartMinutes(
                [[540, 780]],
                [
                    [600, 630],
                    [630, 660],
                ],
                60
            )
        ).toEqual([540, 660, 675, 690, 705, 720]);
    });

    test('las citas desordenadas o fuera de la ventana no afectan el resultado', () => {
        expect(
            computeStartMinutes(
                [[540, 660]],
                [
                    [800, 900],
                    [600, 615],
                    [400, 500],
                ],
                30
            )
        ).toEqual([540, 555, 570, 615, 630]);
    });

    test('una cita que abarca toda la ventana deja cero inicios', () => {
        expect(computeStartMinutes([[540, 780]], [[500, 800]], 60)).toEqual([]);
    });

    test('notBefore descarta inicios pasados', () => {
        expect(computeStartMinutes([[540, 660]], [], 30, 601)).toEqual([615, 630]);
    });
});

describe('getAvailableSlots', () => {
    test('día libre devuelve inicios cada 15 min en UTC', async () => {
        expect(await run()).toEqual([{ barberId: BARBER, startTimes: every15('09:00', '12:00') }]);
    });

    test('una cita a mitad de la ventana: quita los traslapados y reanuda al terminar', async () => {
        getBlockingAppointmentsByBarberIdsAndRange.mockResolvedValue([appt('10:00', '10:30')]);
        const [result] = await run();
        expect(result.startTimes).toEqual([iso('09:00'), ...every15('10:30', '12:00')]);
    });

    test('citas consecutivas sin hueco no dejan falso positivo', async () => {
        getBlockingAppointmentsByBarberIdsAndRange.mockResolvedValue([appt('10:00', '10:30'), appt('10:30', '11:00')]);
        const [result] = await run();
        expect(result.startTimes).toEqual([iso('09:00'), ...every15('11:00', '12:00')]);
    });

    test('una cita que abarca toda la ventana deja cero slots', async () => {
        getBlockingAppointmentsByBarberIdsAndRange.mockResolvedValue([appt('08:00', '14:00')]);
        expect(await run()).toEqual([{ barberId: BARBER, startTimes: [] }]);
    });

    test('la ventana disponible es la del turno del barbero', async () => {
        getAllShifts.mockResolvedValue([{ id: SHIFT, start_time: '10:00:00', end_time: '12:00:00' }]);
        const [result] = await run();
        expect(result.startTimes).toEqual(every15('10:00', '11:00'));
    });

    test('domingo: ninguna sucursal abre, no hay horarios disponibles', async () => {
        const sunday = nextDayOfWeek(TOMORROW, 0);
        const result = await getAvailableSlots({ shopId: SHOP, date: sunday, serviceIds: [SERVICE] });
        expect(result).toEqual([{ barberId: BARBER, startTimes: [] }]);
        // Corte temprano: ni turnos ni citas se consultan si la sucursal no abre ese día.
        expect(getAllShifts).not.toHaveBeenCalled();
        expect(getBlockingAppointmentsByBarberIdsAndRange).not.toHaveBeenCalled();
    });

    test('turnos y citas se atribuyen a su barbero sin contaminación cruzada', async () => {
        const SHIFT2 = 'shift-2';
        getServicesByIds.mockResolvedValue([{ id: SERVICE, duration_minutes: 30, is_active: true }]);
        getActiveBarbersByShop.mockResolvedValue([
            { id: BARBER, shift_id: SHIFT },
            { id: 'barber-2', shift_id: SHIFT2 },
        ]);
        getAllShifts.mockResolvedValue([
            { id: SHIFT, start_time: '09:00:00', end_time: '13:00:00' },
            { id: SHIFT2, start_time: '15:00:00', end_time: '16:00:00' },
        ]);
        getBlockingAppointmentsByBarberIdsAndRange.mockResolvedValue([
            appt('09:00', '12:30'),
            appt('15:00', '15:30', 'barber-2'),
        ]);
        expect(await run()).toEqual([
            { barberId: BARBER, startTimes: [iso('12:30')] },
            { barberId: 'barber-2', startTimes: [iso('15:30')] },
        ]);
    });

    test('varios servicios: los inicios se calculan con la suma de sus duraciones', async () => {
        getServicesByIds.mockResolvedValue([
            { id: SERVICE, duration_minutes: 60, is_active: true },
            { id: 'service-2', duration_minutes: 30, is_active: true },
        ]);
        const result = await getAvailableSlots({ shopId: SHOP, date: TOMORROW, serviceIds: [SERVICE, 'service-2'] });
        // ventana 09:00-13:00 con 90 min: el último inicio es 11:30
        expect(result).toEqual([{ barberId: BARBER, startTimes: every15('09:00', '11:30') }]);
    });

    test('servicio desconocido lanza NOT_FOUND', async () => {
        getServicesByIds.mockResolvedValue([]);
        await expect(run()).rejects.toMatchObject({ code: ApiErrorCode.NOT_FOUND });
    });

    test('servicio inactivo lanza NOT_FOUND', async () => {
        getServicesByIds.mockResolvedValue([{ id: SERVICE, duration_minutes: 60, is_active: false }]);
        await expect(run()).rejects.toMatchObject({ code: ApiErrorCode.NOT_FOUND });
    });

    test('sucursal desconocida lanza NOT_FOUND', async () => {
        getShopById.mockResolvedValue(null);
        await expect(run()).rejects.toBeInstanceOf(ApiError);
        await expect(run()).rejects.toMatchObject({ code: ApiErrorCode.NOT_FOUND });
    });

    test('sucursal inactiva lanza NOT_FOUND', async () => {
        getShopById.mockResolvedValue({ id: SHOP, is_active: false });
        await expect(run()).rejects.toMatchObject({ code: ApiErrorCode.NOT_FOUND });
    });

    test('rechaza fechas pasadas', async () => {
        const yesterday = addDays(getBusinessToday(), -1);
        await expect(getAvailableSlots({ shopId: SHOP, date: yesterday, serviceIds: [SERVICE] })).rejects.toMatchObject(
            {
                code: ApiErrorCode.INVALID_INPUT,
            }
        );
    });

    test('rechaza fechas más allá del horizonte de reserva', async () => {
        const tooFar = addDays(getBusinessToday(), MAX_BOOKING_DAYS_AHEAD + 1);
        await expect(getAvailableSlots({ shopId: SHOP, date: tooFar, serviceIds: [SERVICE] })).rejects.toMatchObject({
            code: ApiErrorCode.INVALID_INPUT,
        });
    });

    describe('"hoy" se calcula en la zona horaria del negocio', () => {
        afterEach(() => {
            jest.restoreAllMocks();
            delete mockConfig.BUSINESS_TIMEZONE;
        });

        // 05:00Z del día 15 son las 22:00 del día 14 en Tijuana (UTC-7): la fecha UTC y la del negocio difieren.
        const freeze = (utcIso: string) => jest.spyOn(Date, 'now').mockReturnValue(Date.parse(utcIso));

        test('acepta el día de hoy del negocio aunque en UTC ya sea el día siguiente', async () => {
            mockConfig.BUSINESS_TIMEZONE = 'America/Tijuana';
            freeze('2026-10-15T05:00:00Z');
            await expect(
                getAvailableSlots({ shopId: SHOP, date: '2026-10-14', serviceIds: [SERVICE] })
            ).resolves.toBeDefined();
        });

        test('rechaza el día anterior al de hoy del negocio aunque en UTC todavía sea hoy', async () => {
            mockConfig.BUSINESS_TIMEZONE = 'America/Tijuana';
            freeze('2026-10-15T05:00:00Z');
            await expect(
                getAvailableSlots({ shopId: SHOP, date: '2026-10-13', serviceIds: [SERVICE] })
            ).rejects.toMatchObject({ code: ApiErrorCode.INVALID_INPUT });
        });

        test('con una zona adelantada a UTC, "hoy" ya es el día siguiente en UTC', async () => {
            mockConfig.BUSINESS_TIMEZONE = 'Asia/Tokyo';
            freeze('2026-10-14T20:00:00Z'); // 05:00 del 15 en Tokio
            await expect(
                getAvailableSlots({ shopId: SHOP, date: '2026-10-14', serviceIds: [SERVICE] })
            ).rejects.toMatchObject({ code: ApiErrorCode.INVALID_INPUT });
            await expect(
                getAvailableSlots({ shopId: SHOP, date: '2026-10-15', serviceIds: [SERVICE] })
            ).resolves.toBeDefined();
        });

        test('hoy no ofrece horarios anteriores a la hora de pared del negocio', async () => {
            mockConfig.BUSINESS_TIMEZONE = 'America/Tijuana';
            freeze('2026-10-14T17:00:00Z'); // 10:00 en Tijuana
            const result = await getAvailableSlots({ shopId: SHOP, date: '2026-10-14', serviceIds: [SERVICE] });
            // Turno 09:00-13:00 hora de Tijuana, servicio de 60 min: el último inicio es 12:00; el primero, 10:00.
            const atTijuana = (hhmm: string) =>
                new Date(
                    businessWallClockToUtcMs(Date.parse(`2026-10-14T${hhmm}:00.000Z`), 'America/Tijuana')
                ).toISOString();
            expect(result[0].startTimes[0]).toBe(atTijuana('10:00'));
            expect(result[0].startTimes.at(-1)).toBe(atTijuana('12:00'));
        });
    });

    test('rechaza fechas con formato inválido', async () => {
        await expect(
            getAvailableSlots({ shopId: SHOP, date: '2026-02-30', serviceIds: [SERVICE] })
        ).rejects.toMatchObject({ code: ApiErrorCode.INVALID_INPUT });
    });
});

describe('getNextAvailableSlots', () => {
    // Miércoles 14 de octubre de 2026 en la zona por defecto del negocio (America/Mazatlan, UTC-7).
    const WEDNESDAY = '2026-10-14';
    const atWed = (hhmm: string) => at(hhmm, WEDNESDAY).toISOString();
    const freezeAt = (date: string, hhmm: string) =>
        jest.spyOn(Date, 'now').mockReturnValue(at(hhmm, date).getTime());

    const runNext = () => getNextAvailableSlots({ shopId: SHOP, serviceIds: [SERVICE] });

    beforeEach(() => {
        // Servicio de 30 min y tres barberos con el turno 09:00-13:00 del beforeEach general.
        getServicesByIds.mockResolvedValue([{ id: SERVICE, duration_minutes: 30, is_active: true }]);
        getActiveBarbersByShop.mockResolvedValue([
            { id: 'barber-1', shift_id: SHIFT, first_name: 'Carlos', last_name: 'Ruiz' },
            { id: 'barber-2', shift_id: SHIFT, first_name: 'Beto', last_name: 'López' },
            { id: 'barber-3', shift_id: SHIFT, first_name: 'Ana', last_name: 'Díaz' },
        ]);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('devuelve el próximo slot de cada barbero, ordenado por hora y descartando horas pasadas', async () => {
        freezeAt(WEDNESDAY, '10:05');
        getBlockingAppointmentsByBarberIdsAndRange.mockResolvedValue([
            { barber_id: 'barber-1', scheduled_start: at('10:00', WEDNESDAY), scheduled_end: at('11:00', WEDNESDAY) },
        ]);

        // 10:05: el primer inicio libre es 10:15 (09:00-10:00 ya pasó); barber-1 está ocupado hasta las 11:00.
        // barber-2 y barber-3 empatan a las 10:15 y se ordenan por nombre solo para una respuesta estable.
        expect(await runNext()).toEqual([
            { barberId: 'barber-3', barberName: 'Ana Díaz', startTime: atWed('10:15') },
            { barberId: 'barber-2', barberName: 'Beto López', startTime: atWed('10:15') },
            { barberId: 'barber-1', barberName: 'Carlos Ruiz', startTime: atWed('11:00') },
        ]);
    });

    test('consulta la disponibilidad del día actual del negocio', async () => {
        freezeAt(WEDNESDAY, '10:05');
        await runNext();
        // El rango de citas consultado es el del miércoles en hora del negocio.
        const [, from, to] = getBlockingAppointmentsByBarberIdsAndRange.mock.calls[0];
        expect(from).toEqual(at('00:00', WEDNESDAY));
        expect(to).toEqual(at('00:00', addDays(WEDNESDAY, 1)));
    });

    test('un barbero sin cupo restante hoy se omite de la lista', async () => {
        freezeAt(WEDNESDAY, '10:05');
        getBlockingAppointmentsByBarberIdsAndRange.mockResolvedValue([
            { barber_id: 'barber-2', scheduled_start: at('10:00', WEDNESDAY), scheduled_end: at('13:00', WEDNESDAY) },
        ]);

        const result = await runNext();
        expect(result.map((s) => s.barberId)).toEqual(['barber-3', 'barber-1']);
    });

    test('domingo (día cerrado): lista vacía', async () => {
        freezeAt(nextDayOfWeek(WEDNESDAY, 0), '10:05');
        expect(await runNext()).toEqual([]);
        // Sin ningún slot no hace falta volver a consultar los barberos para obtener sus nombres.
        expect(getActiveBarbersByShop).toHaveBeenCalledTimes(1);
    });

    test('después del fin de los turnos: lista vacía', async () => {
        freezeAt(WEDNESDAY, '12:45');
        // Servicio de 30 min, turno hasta 13:00: el último inicio posible era 12:30.
        expect(await runNext()).toEqual([]);
    });

    test('sucursal sin barberos elegibles: lista vacía', async () => {
        freezeAt(WEDNESDAY, '10:05');
        getActiveBarbersByShop.mockResolvedValue([]);
        expect(await runNext()).toEqual([]);
    });
});
