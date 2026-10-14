import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getActiveBarbersByShop } from '../src/repositories/barberRepository.js';
import { insertManager, insertShop, insertBarber, cleanupFixtures } from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

describe('Endpoint de Barberos por Sucursal', () => {
    let targetShopId: string;
    let emptyShopId: string;

    let eligibleBarberId: string;
    let deletedBarberId: string;
    let notAcceptingBarberId: string;
    let otherShopBarberId: string;

    beforeAll(async () => {
        await connectDB();
        const pool = getPool();

        // 1. Obtener un turno válido del catálogo ENUM existente
        const shiftRes = await pool.query(`SELECT id FROM shifts LIMIT 1`);
        if (shiftRes.rows.length === 0) throw new Error("No hay turnos en la tabla 'shifts'.");
        const shiftId = shiftRes.rows[0].id;

        // 2. Crear Manager (El mánager es un 'user')
        const manager = await insertManager();

        // 3. Crear Sucursales
        targetShopId = await insertShop(manager.id, { name: 'Target Shop' });
        const otherShopId = await insertShop(manager.id, { name: 'Other Shop' });
        emptyShopId = await insertShop(manager.id, { name: 'Empty Shop' });

        // 4. Crear Barberos directamente usando los helpers compartidos
        const eligibleBarber = await insertBarber(targetShopId, { shiftId, isAcceptingBookings: true, isDeleted: false });
        eligibleBarberId = eligibleBarber.id;

        const deletedBarber = await insertBarber(targetShopId, { shiftId, isAcceptingBookings: true, isDeleted: true });
        deletedBarberId = deletedBarber.id;

        const notAcceptingBarber = await insertBarber(targetShopId, { shiftId, isAcceptingBookings: false, isDeleted: false });
        notAcceptingBarberId = notAcceptingBarber.id;

        const otherShopBarber = await insertBarber(otherShopId, { shiftId, isAcceptingBookings: true, isDeleted: false });
        otherShopBarberId = otherShopBarber.id;
    });

    afterAll(async () => {
        await cleanupFixtures();
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
