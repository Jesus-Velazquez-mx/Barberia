import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getActiveBarbersByShop } from '../src/repositories/barberRepository.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

describe('Endpoint de Barberos por Sucursal', () => {
    let managerId: string;
    let targetShopId: string;
    let otherShopId: string;
    let emptyShopId: string;
    let shiftId: string;

    let eligibleBarberId: string;
    let deletedBarberId: string;
    let notAcceptingBarberId: string;
    let otherShopBarberId: string;

    const createdBarberIds: string[] = [];
    const createdShopIds: string[] = [];

    // Contadores para asegurar restricciones UNIQUE de tu BD
    let phoneCounter = 6671000000;
    const getPhone = () => (phoneCounter++).toString();
    const getEmail = (prefix: string) => `${prefix}_${Date.now()}@mrbarber.test`;

    beforeAll(async () => {
        await connectDB();
        const pool = getPool();

        // 1. Obtener un turno válido del catálogo ENUM existente
        const shiftRes = await pool.query(`SELECT id FROM shifts LIMIT 1`);
        if (shiftRes.rows.length === 0) throw new Error("No hay turnos en la tabla 'shifts'.");
        shiftId = shiftRes.rows[0].id;

        // 2. Crear Manager (El mánager es un 'user')
        const managerRes = await pool.query(
            `INSERT INTO users (role, email, phone, password_hash, first_name, last_name, birth_date, gender) 
             VALUES ('manager', $1, $2, 'hash', 'Mgr', 'Test', '1990-01-01', 'other') RETURNING id`,
            [getEmail('mgr'), getPhone()]
        );
        managerId = managerRes.rows[0].id;
        await pool.query(`INSERT INTO managers (user_id) VALUES ($1)`, [managerId]);

        // 3. Crear Sucursales
        const createShop = async (name: string) => {
            const res = await pool.query(
                `INSERT INTO shops (name, manager_id, is_active) VALUES ($1, $2, true) RETURNING id`,
                [`${name} ${Date.now()}`, managerId]
            );
            createdShopIds.push(res.rows[0].id);
            return res.rows[0].id;
        };

        targetShopId = await createShop('Target Shop');
        otherShopId = await createShop('Other Shop');
        emptyShopId = await createShop('Empty Shop');

        // 4. Crear Barberos directamente en la tabla 'barbers' (no son usuarios)
        const createBarber = async (shop: string, isAccepting: boolean, isDeleted: boolean) => {
            const bRes = await pool.query(
                `INSERT INTO barbers (first_name, last_name, email, phone, shop_id, shift_id, is_accepting_bookings, deleted_at, birth_date, gender)
                 VALUES ('Barber', 'Test', $1, $2, $3, $4, $5, $6, '1990-01-01', 'other') RETURNING id`,
                [getEmail('barber'), getPhone(), shop, shiftId, isAccepting, isDeleted ? new Date() : null]
            );
            createdBarberIds.push(bRes.rows[0].id);
            return bRes.rows[0].id;
        };

        // Mezcla de barberos exigida por el Criterio de Aceptación
        eligibleBarberId = await createBarber(targetShopId, true, false); // Debe incluirse
        deletedBarberId = await createBarber(targetShopId, true, true); // Excluido (soft delete)
        notAcceptingBarberId = await createBarber(targetShopId, false, false); // Excluido (no acepta reservas)
        otherShopBarberId = await createBarber(otherShopId, true, false); // Excluido (otra tienda)
    });

    afterAll(async () => {
        const pool = getPool();
        if (createdBarberIds.length > 0)
            await pool.query(`DELETE FROM barbers WHERE id = ANY($1::uuid[])`, [createdBarberIds]);
        if (createdShopIds.length > 0)
            await pool.query(`DELETE FROM shops WHERE id = ANY($1::uuid[])`, [createdShopIds]);
        if (managerId) {
            await pool.query(`DELETE FROM managers WHERE user_id = $1`, [managerId]);
            await pool.query(`DELETE FROM users WHERE id = $1`, [managerId]);
        }
        await closeDB();
    });

    describe('Repositorio: getActiveBarbersByShop', () => {
        test('Debe retornar SOLO barberos elegibles y excluir eliminados, inactivos y de otras sucursales', async () => {
            const barbers = await getActiveBarbersByShop(targetShopId);
            const returnedIds = barbers.map((b: any) => b.id);

            expect(returnedIds).toContain(eligibleBarberId);
            expect(returnedIds).not.toContain(deletedBarberId);
            expect(returnedIds).not.toContain(notAcceptingBarberId);
            expect(returnedIds).not.toContain(otherShopBarberId);
        });
    });

    describe('GET /api/shops/:id/barbers', () => {
        test('Debe responder 200 y devolver solo al barbero elegible', async () => {
            const res = await request(app).get(`/api/shops/${targetShopId}/barbers`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            const ids = res.body.data.map((b: any) => b.id);
            expect(ids).toContain(eligibleBarberId);
            expect(ids).not.toContain(deletedBarberId);
        });

        test('Debe responder 200 y un arreglo VACÍO si la sucursal existe pero no tiene barberos', async () => {
            const res = await request(app).get(`/api/shops/${emptyShopId}/barbers`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });

        test('Debe responder 404 cuando el id de la sucursal NO existe', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app).get(`/api/shops/${fakeUuid}/barbers`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Shop not found/i);
        });
    });
});
