import { jest } from '@jest/globals';

// ESM: los mocks deben registrarse antes de importar dinámicamente el servicio.
const getServiceById = jest.fn<(...args: any[]) => Promise<any>>();
const getShopById = jest.fn<(...args: any[]) => Promise<any>>();
const getActiveBarbersByShop = jest.fn<(...args: any[]) => Promise<any>>();
const getActiveSlotsByBarberIdsAndDay = jest.fn<(...args: any[]) => Promise<any>>();
const getBlockingAppointmentsByBarberIdsAndRange = jest.fn<(...args: any[]) => Promise<any>>();
const getAllShifts = jest.fn<(...args: any[]) => Promise<any>>();

jest.unstable_mockModule('../src/repositories/serviceRepository.js', () => ({ getServiceById }));
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

const SHOP = 'shop-1';
const SERVICE = 'service-1';
const BARBER = 'barber-1';
const SHIFT = 'shift-1';

const DAY_MS = 86_400_000;
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const TOMORROW = isoDate(Date.now() + DAY_MS);
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
        const yesterday = isoDate(Date.now() - DAY_MS);
        await expect(getAvailableSlots({ shopId: SHOP, date: yesterday, serviceId: SERVICE })).rejects.toMatchObject({
            code: ApiErrorCode.INVALID_INPUT,
        });
    });

    test('rechaza fechas más allá del horizonte de reserva', async () => {
        const tooFar = isoDate(Date.now() + (MAX_BOOKING_DAYS_AHEAD + 1) * DAY_MS);
        await expect(getAvailableSlots({ shopId: SHOP, date: tooFar, serviceId: SERVICE })).rejects.toMatchObject({
            code: ApiErrorCode.INVALID_INPUT,
        });
    });

    test('rechaza fechas con formato inválido', async () => {
        await expect(getAvailableSlots({ shopId: SHOP, date: '2026-02-30', serviceId: SERVICE })).rejects.toMatchObject(
            { code: ApiErrorCode.INVALID_INPUT }
        );
    });
});
