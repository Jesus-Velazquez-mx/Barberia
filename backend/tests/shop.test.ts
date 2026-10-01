import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js'; // Importamos tu router principal
import connection from '../src/connection/connection.js';
import { getActiveShops } from '../src/repositories/shopRepository.js';

const { connectDB, closeDB, getPool } = connection;

// Creamos una instancia de app aislada solo para estas pruebas
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Pruebas de endpoints de Shops (Sucursales)', () => {
    let dummyManagerId: string;
    let activeShopId1: string;
    let activeShopId2: string;
    let inactiveShopId: string;
    
    const createdShopIds: string[] = [];

    beforeAll(async () => {
        await connectDB();
        const pool = getPool();

        // 1. Crear un manager necesario para satisfacer la llave foránea (manager_id) de las tiendas
        const userRes = await pool.query(
            `INSERT INTO users (role, email, phone, password_hash, first_name, last_name) 
             VALUES ('manager', 'shop_test_manager_${Date.now()}@mrbarber.com', '5555555555', 'hash', 'Shop', 'Manager') RETURNING id`
        );
        dummyManagerId = userRes.rows[0].id;
        await pool.query('INSERT INTO managers (user_id) VALUES ($1)', [dummyManagerId]);

        // 2. Insertar 2 sucursales activas (A y Z para validar orden)
        const shop1Res = await pool.query(
            `INSERT INTO shops (name, manager_id, is_active) VALUES ('A_Active Shop', $1, true) RETURNING id`,
            [dummyManagerId]
        );
        activeShopId1 = shop1Res.rows[0].id;
        createdShopIds.push(activeShopId1);

        const shop2Res = await pool.query(
            `INSERT INTO shops (name, manager_id, is_active) VALUES ('Z_Active Shop', $1, true) RETURNING id`,
            [dummyManagerId]
        );
        activeShopId2 = shop2Res.rows[0].id;
        createdShopIds.push(activeShopId2);

        // 3. Insertar 1 sucursal inactiva
        const inactiveShopRes = await pool.query(
            `INSERT INTO shops (name, manager_id, is_active) VALUES ('Inactive Shop Test', $1, false) RETURNING id`,
            [dummyManagerId]
        );
        inactiveShopId = inactiveShopRes.rows[0].id;
        createdShopIds.push(inactiveShopId);
    });

    afterAll(async () => {
        const pool = getPool();
        if (createdShopIds.length > 0) {
            await pool.query('DELETE FROM shops WHERE id = ANY($1)', [createdShopIds]);
        }
        if (dummyManagerId) {
            await pool.query('DELETE FROM managers WHERE user_id = $1', [dummyManagerId]);
            await pool.query('DELETE FROM users WHERE id = $1', [dummyManagerId]);
        }
        await closeDB();
    });

    describe('Repositorio: getActiveShops()', () => {
        test('Debe devolver solo sucursales activas, excluyendo las inactivas', async () => {
            const shops = await getActiveShops();
            const shopIds = shops.map(s => s.id);
            
            expect(shopIds).toContain(activeShopId1);
            expect(shopIds).toContain(activeShopId2);
            expect(shopIds).not.toContain(inactiveShopId);
        });
    });

    describe('GET /api/shops', () => {
        test('Debe responder 200 y una lista de sucursales activas sin el manager_id', async () => {
            const res = await request(app).get('/api/shops');
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            
            const shop = res.body.data.find((s: any) => s.id === activeShopId1);
            expect(shop).toBeDefined();
            expect(shop.isActive).toBe(true);
            expect(shop).not.toHaveProperty('manager_id');
            expect(shop).not.toHaveProperty('managerId');
        });
    });

    describe('GET /api/shops/:id', () => {
        test('Debe responder 200 y los detalles para una sucursal activa', async () => {
            const res = await request(app).get(`/api/shops/${activeShopId1}`);
            
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(activeShopId1);
            expect(res.body.data.isActive).toBe(true);
            expect(res.body.data).not.toHaveProperty('manager_id');
        });

        test('Debe responder 404 para una sucursal inactiva', async () => {
            const res = await request(app).get(`/api/shops/${inactiveShopId}`);
            
            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/not found or is inactive/i);
        });

        test('Debe responder 404 para un UUID que no existe', async () => {
            // Se utiliza un UUID v4 estructuralmente válido, pero que no existe en la BD
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app).get(`/api/shops/${fakeUuid}`);
            
            expect(res.status).toBe(404);
        });

        test('Debe responder 400 Validation Error para un UUID mal formado', async () => {
            const badUuid = 'not-a-uuid';
            const res = await request(app).get(`/api/shops/${badUuid}`);
            
            expect(res.status).toBe(400);
            // Se especifica la propiedad "detail" del objeto de error devuelto por Zod
            expect(res.body.error[0].detail).toMatch(/Invalid shop ID format/i);
        });
    });
});