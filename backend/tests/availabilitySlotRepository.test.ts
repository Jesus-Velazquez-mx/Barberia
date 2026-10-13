import connection from '../src/connection/connection.js';
import {
    getActiveSlotsByBarberAndDay,
    getActiveSlotsByBarberIdsAndDay,
} from '../src/repositories/availabilitySlotRepository.js';
import {
    insertManager,
    insertShop,
    insertBarber,
    insertAvailabilitySlot,
    cleanupFixtures,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB } = connection;

describe('availabilitySlotRepository', () => {
    let barberA: string;
    let barberB: string;

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        const shopId = await insertShop(manager.id, { name: `Slots Shop ${Date.now()}` });

        const createdBarberA = await insertBarber(shopId);
        const createdBarberB = await insertBarber(shopId);
        barberA = createdBarberA.id;
        barberB = createdBarberB.id;

        await insertAvailabilitySlot(barberA, shopId, 1, '09:00', '12:00', true); // lunes, activo
        await insertAvailabilitySlot(barberA, shopId, 1, '13:00', '15:00', false); // lunes, inactivo
        await insertAvailabilitySlot(barberA, shopId, 2, '09:00', '12:00', true); // martes
        await insertAvailabilitySlot(barberA, shopId, 0, '10:00', '14:00', true); // domingo
        await insertAvailabilitySlot(barberB, shopId, 1, '14:00', '18:00', true); // lunes, otro barbero
        await insertAvailabilitySlot(barberB, shopId, 3, '08:00', '10:00', true); // miércoles
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    test('devuelve solo los slots activos del día pedido', async () => {
        const slots = await getActiveSlotsByBarberAndDay(barberA, 1);
        expect(slots).toHaveLength(1);
        expect(slots[0]).toMatchObject({ barber_id: barberA, day_of_week: 1, start_time: '09:00:00', is_active: true });
    });

    test('day_of_week 0 corresponde al domingo', async () => {
        const slots = await getActiveSlotsByBarberAndDay(barberA, 0);
        expect(slots.map((s) => s.start_time)).toEqual(['10:00:00']);
    });

    test('un día sin plantilla devuelve lista vacía', async () => {
        expect(await getActiveSlotsByBarberAndDay(barberA, 5)).toEqual([]);
    });

    test('la variante por lotes atribuye cada slot a su barbero sin contaminación cruzada', async () => {
        const slots = await getActiveSlotsByBarberIdsAndDay([barberA, barberB], 1);
        expect(slots).toHaveLength(2);
        expect(slots.filter((s) => s.barber_id === barberA).map((s) => s.start_time)).toEqual(['09:00:00']);
        expect(slots.filter((s) => s.barber_id === barberB).map((s) => s.start_time)).toEqual(['14:00:00']);
    });

    test('la variante por lotes con lista vacía no consulta y devuelve []', async () => {
        expect(await getActiveSlotsByBarberIdsAndDay([], 1)).toEqual([]);
    });
});
