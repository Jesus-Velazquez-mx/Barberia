import { jest } from '@jest/globals';

// ESM: los mocks deben registrarse antes de importar dinámicamente el servicio.
const getServiceById = jest.fn<(...args: any[]) => Promise<any>>();
const getShopById = jest.fn<(...args: any[]) => Promise<any>>();
const getActiveBarbersByShop = jest.fn<(...args: any[]) => Promise<any>>();
const getActiveSlotsByBarberIdsAndDay = jest.fn<(...args: any[]) => Promise<any>>();
const getBlockingAppointmentsByBarberIdsAndRange = jest.fn<(...args: any[]) => Promise<any>>();
const getAllShifts = jest.fn<(...args: any[]) => Promise<any>>();

// La zona horaria del negocio sale de globalConfig; el mock es mutable para fijarla por prueba.
const mockConfig: { BUSINESS_TIMEZONE?: string } = {};

jest.unstable_mockModule('../src/config/globalConfig.js', () => ({ default: mockConfig }));
jest.unstable_mockModule('../src/repositories/offeredServiceRepository.js', () => ({ getServiceById }));
jest.unstable_mockModule('../src/repositories/shopRepository.js', () => ({ getShopById }));
jest.unstable_mockModule('../src/repositories/barberRepository.js', () => ({ getActiveBarbersByShop }));
jest.unstable_mockModule('../src/repositories/availabilitySlotRepository.js', () => ({
    getActiveSlotsByBarberIdsAndDay,
}));
jest.unstable_mockModule('../src/repositories/appointmentRepository.js', () => ({
    getBlockingAppointmentsByBarberIdsAndRange,
}));
jest.unstable_mockModule('../src/repositories/shiftRepository.js', () => ({ getAllShifts }));

const { getAvailableSlots, computeStartMinutes, MAX_BOOKING_DAYS_AHEAD } =
    await import('../src/services/availabilityService.js');
const { ApiError, ApiErrorCode } = await import('../src/errors/ApiError.js');
const { getBusinessToday } = await import('../src/utils/businessTime.js');

const SHOP = 'shop-1';
const SERVICE = 'service-1';
const BARBER = 'barber-1';
const SHIFT = 'shift-1';

const DAY_MS = 86_400_000;
/** Suma `days` a una fecha 'YYYY-MM-DD' (calendario, sin zona horaria). */
const addDays = (date: string, days: number) =>
    new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
// "Hoy" es el de la zona horaria del negocio, igual que en el servicio.
const TOMORROW = addDays(getBusinessToday(), 1);
const at = (hhmm: string, date = TOMORROW) => new Date(`${date}T${hhmm}:00.000Z`);
const iso = (hhmm: string) => at(hhmm).toISOString();
/** Inicios cada 15 min desde `first` hasta `last` (inclusive), en ISO. */
const every15 = (first: string, last: string) => {
    const out: string[] = [];
    for (let t = at(first).getTime(); t <= at(last).getTime(); t += 15 * 60_000) out.push(new Date(t).toISOString());
    return out;
};

const slot = (start: string, end: string, barberId = BARBER) => ({
    barber_id: barberId,
    shop_id: SHOP,
    start_time: `${start}:00`,
    end_time: `${end}:00`,
});
const appt = (start: string, end: string, barberId = BARBER) => ({
    barber_id: barberId,
    scheduled_start: at(start),
    scheduled_end: at(end),
});

const run = () => getAvailableSlots({ shopId: SHOP, date: TOMORROW, serviceId: SERVICE });

beforeEach(() => {
    jest.resetAllMocks();
    getServiceById.mockResolvedValue({ id: SERVICE, duration_minutes: 60, is_active: true });
    getShopById.mockResolvedValue({ id: SHOP, is_active: true });
    getActiveBarbersByShop.mockResolvedValue([{ id: BARBER, shift_id: SHIFT }]);
    getAllShifts.mockResolvedValue([{ id: SHIFT, start_time: '08:00:00', end_time: '20:00:00' }]);
    getActiveSlotsByBarberIdsAndDay.mockResolvedValue([slot('09:00', '13:00')]);
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
        expect(getActiveSlotsByBarberIdsAndDay).toHaveBeenCalledWith([BARBER], at('00:00').getUTCDay());
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

    test('sin plantilla para ese día devuelve lista vacía sin lanzar', async () => {
        getActiveSlotsByBarberIdsAndDay.mockResolvedValue([]);
        expect(await run()).toEqual([{ barberId: BARBER, startTimes: [] }]);
    });

    test('una cita que abarca toda la ventana deja cero slots', async () => {
        getBlockingAppointmentsByBarberIdsAndRange.mockResolvedValue([appt('08:00', '14:00')]);
        expect(await run()).toEqual([{ barberId: BARBER, startTimes: [] }]);
    });

    test('la ventana de la plantilla se acota al turno del barbero', async () => {
        getAllShifts.mockResolvedValue([{ id: SHIFT, start_time: '10:00:00', end_time: '12:00:00' }]);
        const [result] = await run();
        expect(result.startTimes).toEqual(every15('10:00', '11:00'));
    });

    test('slots y citas se atribuyen a su barbero sin contaminación cruzada', async () => {
        getActiveBarbersByShop.mockResolvedValue([
            { id: BARBER, shift_id: SHIFT },
            { id: 'barber-2', shift_id: SHIFT },
        ]);
        getActiveSlotsByBarberIdsAndDay.mockResolvedValue([slot('09:00', '10:30'), slot('15:00', '16:00', 'barber-2')]);
        getBlockingAppointmentsByBarberIdsAndRange.mockResolvedValue([appt('15:00', '16:00')]);
        expect(await run()).toEqual([
            { barberId: BARBER, startTimes: every15('09:00', '09:30') },
            { barberId: 'barber-2', startTimes: [iso('15:00')] },
        ]);
    });

    test('servicio desconocido lanza NOT_FOUND', async () => {
        getServiceById.mockResolvedValue(null);
        await expect(run()).rejects.toMatchObject({ code: ApiErrorCode.NOT_FOUND });
    });

    test('servicio inactivo lanza NOT_FOUND', async () => {
        getServiceById.mockResolvedValue({ id: SERVICE, duration_minutes: 60, is_active: false });
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
        await expect(getAvailableSlots({ shopId: SHOP, date: yesterday, serviceId: SERVICE })).rejects.toMatchObject({
            code: ApiErrorCode.INVALID_INPUT,
        });
    });

    test('rechaza fechas más allá del horizonte de reserva', async () => {
        const tooFar = addDays(getBusinessToday(), MAX_BOOKING_DAYS_AHEAD + 1);
        await expect(getAvailableSlots({ shopId: SHOP, date: tooFar, serviceId: SERVICE })).rejects.toMatchObject({
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
                getAvailableSlots({ shopId: SHOP, date: '2026-10-14', serviceId: SERVICE })
            ).resolves.toBeDefined();
        });

        test('rechaza el día anterior al de hoy del negocio aunque en UTC todavía sea hoy', async () => {
            mockConfig.BUSINESS_TIMEZONE = 'America/Tijuana';
            freeze('2026-10-15T05:00:00Z');
            await expect(
                getAvailableSlots({ shopId: SHOP, date: '2026-10-13', serviceId: SERVICE })
            ).rejects.toMatchObject({ code: ApiErrorCode.INVALID_INPUT });
        });

        test('con una zona adelantada a UTC, "hoy" ya es el día siguiente en UTC', async () => {
            mockConfig.BUSINESS_TIMEZONE = 'Asia/Tokyo';
            freeze('2026-10-14T20:00:00Z'); // 05:00 del 15 en Tokio
            await expect(
                getAvailableSlots({ shopId: SHOP, date: '2026-10-14', serviceId: SERVICE })
            ).rejects.toMatchObject({ code: ApiErrorCode.INVALID_INPUT });
            await expect(
                getAvailableSlots({ shopId: SHOP, date: '2026-10-15', serviceId: SERVICE })
            ).resolves.toBeDefined();
        });

        test('hoy no ofrece horarios anteriores a la hora de pared del negocio', async () => {
            mockConfig.BUSINESS_TIMEZONE = 'America/Tijuana';
            freeze('2026-10-14T17:00:00Z'); // 10:00 en Tijuana
            getActiveSlotsByBarberIdsAndDay.mockResolvedValue([slot('09:00', '13:00')]);
            const result = await getAvailableSlots({ shopId: SHOP, date: '2026-10-14', serviceId: SERVICE });
            // Servicio de 60 min en la ventana 09:00-13:00: el último inicio es 12:00; el primero, 10:00.
            expect(result[0].startTimes[0]).toBe('2026-10-14T10:00:00.000Z');
            expect(result[0].startTimes.at(-1)).toBe('2026-10-14T12:00:00.000Z');
        });
    });

    test('rechaza fechas con formato inválido', async () => {
        await expect(getAvailableSlots({ shopId: SHOP, date: '2026-02-30', serviceId: SERVICE })).rejects.toMatchObject(
            { code: ApiErrorCode.INVALID_INPUT }
        );
    });
});
