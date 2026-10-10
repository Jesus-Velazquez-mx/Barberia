import connection from '../src/connection/connection.js';
import {
    getActiveSlotsByBarberAndDay,
    getActiveSlotsByBarberIdsAndDay,
} from '../src/repositories/availabilitySlotRepository.js';

const { connectDB, closeDB, getPool } = connection;

describe('availabilitySlotRepository', () => {
    let managerId: string;
    let shopId: string;
    let barberA: string;
    let barberB: string;

    let phoneCounter = 6672000000;
    const getPhone = () => (phoneCounter++).toString();
    const getEmail = (prefix: string) => `${prefix}_${Date.now()}_${phoneCounter}@mrbarber.test`;

    const insertSlot = async (barberId: string, day: number, start: string, end: string, isActive = true) => {
        await getPool().query(
            `INSERT INTO availability_slots (barber_id, shop_id, day_of_week, start_time, end_time, is_active)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [barberId, shopId, day, start, end, isActive]
        );
    };

    beforeAll(async () => {
        await connectDB();
        const pool = getPool();

        const shiftId = (await pool.query(`SELECT id FROM shifts LIMIT 1`)).rows[0].id;

        managerId = (
            await pool.query(
                `INSERT INTO users (role, email, phone, password_hash, first_name, last_name, birth_date, gender)
                 VALUES ('manager', $1, $2, 'hash', 'Mgr', 'Test', '1990-01-01', 'other') RETURNING id`,
                [getEmail('mgr'), getPhone()]
            )
        ).rows[0].id;
        await pool.query(`INSERT INTO managers (user_id) VALUES ($1)`, [managerId]);

        shopId = (
            await pool.query(`INSERT INTO shops (name, manager_id) VALUES ($1, $2) RETURNING id`, [
                `Slots Shop ${Date.now()}`,
                managerId,
            ])
        ).rows[0].id;

        const createBarber = async () =>
            (
                await pool.query(
                    `INSERT INTO barbers (first_name, last_name, email, phone, shop_id, shift_id, birth_date, gender)
                     VALUES ('Barber', 'Test', $1, $2, $3, $4, '1990-01-01', 'other') RETURNING id`,
                    [getEmail('barber'), getPhone(), shopId, shiftId]
                )
            ).rows[0].id;
        barberA = await createBarber();
        barberB = await createBarber();

        await insertSlot(barberA, 1, '09:00', '12:00'); // lunes, activo
        await insertSlot(barberA, 1, '13:00', '15:00', false); // lunes, inactivo
        await insertSlot(barberA, 2, '09:00', '12:00'); // martes
        await insertSlot(barberA, 0, '10:00', '14:00'); // domingo
        await insertSlot(barberB, 1, '14:00', '18:00'); // lunes, otro barbero
        await insertSlot(barberB, 3, '08:00', '10:00'); // miércoles
    });

    afterAll(async () => {
        const pool = getPool();
        // availability_slots se borra en cascada con los barberos
        await pool.query(`DELETE FROM barbers WHERE id = ANY($1::uuid[])`, [[barberA, barberB]]);
        await pool.query(`DELETE FROM shops WHERE id = $1`, [shopId]);
        await pool.query(`DELETE FROM managers WHERE user_id = $1`, [managerId]);
        await pool.query(`DELETE FROM users WHERE id = $1`, [managerId]);
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
