import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getActiveShops, getAllShops } from '../src/repositories/shopRepository.js';
import {
    insertManager,
    insertShop,
    insertUser,
    cleanupFixtures,
    generateUniqueFixtureName,
} from './helpers/availabilityFixtures.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string =>
    signToken({ id, role, email } as User);

describe('Pruebas de endpoints de Shops (Sucursales)', () => {
    let dummyManager: { id: string; email: string };
    let clientUser: { id: string; email: string };
    let managerToken: string;
    let clientToken: string;

    let activeShopId1: string;
    let activeShopId2: string;
    let inactiveShopId: string;

    beforeAll(async () => {
        await connectDB();

        // 1. Crear manager y cliente con sus tokens
        dummyManager = await insertManager();
        clientUser = await insertUser('client');

        managerToken = mintToken(dummyManager.id, 'manager', dummyManager.email);
        clientToken = mintToken(clientUser.id, 'client', clientUser.email);

        // 2. Insertar 2 sucursales activas (A y Z para validar orden)
        activeShopId1 = await insertShop(dummyManager.id, { name: 'A_Active Shop', isActive: true });
        activeShopId2 = await insertShop(dummyManager.id, { name: 'Z_Active Shop', isActive: true });

        // 3. Insertar 1 sucursal inactiva
        inactiveShopId = await insertShop(dummyManager.id, { name: 'Inactive Shop Test', isActive: false });
    });

    afterAll(async () => {
        if (dummyManager?.id) {
            await getPool().query('DELETE FROM shops WHERE manager_id = $1', [dummyManager.id]);
        }
        await cleanupFixtures();
        await closeDB();
    });

    describe('Repositorio: getActiveShops() y getAllShops()', () => {
        test('getActiveShops() debe devolver solo sucursales activas, excluyendo las inactivas', async () => {
            const shops = await getActiveShops();
            const shopIds = shops.map((s) => s.id);

            expect(shopIds).toContain(activeShopId1);
            expect(shopIds).toContain(activeShopId2);
            expect(shopIds).not.toContain(inactiveShopId);
        });

        test('getAllShops() debe devolver todas las sucursales, incluyendo las inactivas', async () => {
            const shops = await getAllShops();
            const shopIds = shops.map((s) => s.id);

            expect(shopIds).toContain(activeShopId1);
            expect(shopIds).toContain(activeShopId2);
            expect(shopIds).toContain(inactiveShopId);
        });
    });

    describe('Listar Sucursales (GET /api/shops)', () => {
        test('Debe responder 200 y una lista de sucursales activas sin el manager_id por defecto', async () => {
            const res = await request(app).get('/api/shops');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            const shop = res.body.data.find((s: any) => s.id === activeShopId1);
            expect(shop).toBeDefined();
            expect(shop.isActive).toBe(true);
            expect(shop).not.toHaveProperty('manager_id');
            expect(shop).not.toHaveProperty('managerId');

            const inactiveShop = res.body.data.find((s: any) => s.id === inactiveShopId);
            expect(inactiveShop).toBeUndefined();
        });

        test('Debe responder 200 e incluir sucursales inactivas cuando includeInactive=true', async () => {
            const res = await request(app).get('/api/shops?includeInactive=true');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            const inactiveFound = res.body.data.find((s: any) => s.id === inactiveShopId);
            expect(inactiveFound).toBeDefined();
            expect(inactiveFound.isActive).toBe(false);
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
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app).get(`/api/shops/${fakeUuid}`);

            expect(res.status).toBe(404);
        });

        test('Debe responder 400 Validation Error para un UUID mal formado', async () => {
            const badUuid = 'not-a-uuid';
            const res = await request(app).get(`/api/shops/${badUuid}`);

            expect(res.status).toBe(400);
            expect(res.body.error[0].detail).toMatch(/Invalid shop ID format/i);
        });
    });

    describe('Registrar Sucursal (POST /api/shops)', () => {
        test('Debe responder 201 y crear una nueva sucursal con token de manager', async () => {
            const newShopData = {
                name: generateUniqueFixtureName('ShopCreate'),
                street: 'Calle Ficticia',
                postalCode: '44100',
                number: '1234',
                phone: '3312345678',
            };

            const res = await request(app)
                .post('/api/shops')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(newShopData);

            expect(res.status).toBe(201);
            expect(res.body.data).toBeDefined();
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.name).toBe(newShopData.name);
            expect(res.body.data.street).toBe(newShopData.street);
            expect(res.body.data.postalCode).toBe(newShopData.postalCode);
            expect(res.body.data.number).toBe(newShopData.number);
            expect(res.body.data.phone).toBe(newShopData.phone);
            expect(res.body.data.isActive).toBe(true);
        });

        test('Debe responder 401 si no se envía token de autorización', async () => {
            const res = await request(app)
                .post('/api/shops')
                .send({ name: 'Sin Token Shop' });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Missing or invalid authorization token/i);
        });

        test('Debe responder 403 si el usuario autenticado es un cliente', async () => {
            const res = await request(app)
                .post('/api/shops')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ name: 'Cliente No Puede Crear' });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized/i);
        });

        test('Debe responder 409 si el nombre de la sucursal ya existe', async () => {
            const duplicateName = 'A_Active Shop'; // Ya creada en beforeAll
            const res = await request(app)
                .post('/api/shops')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: duplicateName });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/already in use/i);
        });

        test('Debe responder 400 si falta el nombre obligatorio o el formato es incorrecto', async () => {
            const res = await request(app)
                .post('/api/shops')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ phone: '123' }); // teléfono inválido y sin nombre

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
    });

    describe('Editar Sucursal (PUT /api/shops/:id)', () => {
        let shopToEditId: string;

        beforeAll(async () => {
            shopToEditId = await insertShop(dummyManager.id, {
                name: generateUniqueFixtureName('ShopEdit'),
                isActive: true,
            });
        });

        test('Debe responder 200 y actualizar los campos de la sucursal con éxito', async () => {
            const updatedFields = {
                name: generateUniqueFixtureName('ShopEdited'),
                street: 'Nueva Calle 456',
                phone: '3398765432',
                postalCode: '44200',
            };

            const res = await request(app)
                .put(`/api/shops/${shopToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send(updatedFields);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(shopToEditId);
            expect(res.body.data.name).toBe(updatedFields.name);
            expect(res.body.data.street).toBe(updatedFields.street);
            expect(res.body.data.phone).toBe(updatedFields.phone);
            expect(res.body.data.postalCode).toBe(updatedFields.postalCode);
        });

        test('Debe responder 401 si no se envía token de autorización', async () => {
            const res = await request(app)
                .put(`/api/shops/${shopToEditId}`)
                .send({ name: 'Sin Token' });

            expect(res.status).toBe(401);
        });

        test('Debe responder 403 si un cliente intenta actualizar la sucursal', async () => {
            const res = await request(app)
                .put(`/api/shops/${shopToEditId}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ street: 'Cliente Editando' });

            expect(res.status).toBe(403);
        });

        test('Debe responder 404 si la sucursal no existe', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .put(`/api/shops/${fakeUuid}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ street: 'Calle Fantasma' });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/not found/i);
        });

        test('Debe responder 409 si se intenta cambiar el nombre por uno que ya pertenece a otra sucursal', async () => {
            const res = await request(app)
                .put(`/api/shops/${shopToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: 'A_Active Shop' });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/already in use/i);
        });

        test('Debe responder 400 si el cuerpo de actualización está vacío', async () => {
            const res = await request(app)
                .put(`/api/shops/${shopToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error[0].detail).toMatch(/At least one field must be provided/i);
        });
    });

    describe('Eliminar Sucursal - Borrado Lógico (DELETE /api/shops/:id)', () => {
        let shopToDeleteId: string;

        beforeAll(async () => {
            shopToDeleteId = await insertShop(dummyManager.id, {
                name: generateUniqueFixtureName('ShopDel'),
                isActive: true,
            });
        });

        test('Debe responder 401 si no se envía token de autorización', async () => {
            const res = await request(app).delete(`/api/shops/${shopToDeleteId}`);

            expect(res.status).toBe(401);
        });

        test('Debe responder 403 si un cliente intenta eliminar la sucursal', async () => {
            const res = await request(app)
                .delete(`/api/shops/${shopToDeleteId}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
        });

        test('Debe responder 404 si la sucursal a eliminar no existe', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .delete(`/api/shops/${fakeUuid}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(404);
        });

        test('Debe responder 200 y realizar borrado lógico (is_active = false) sin borrar la fila en BD', async () => {
            // 1. Ejecutar el DELETE
            const res = await request(app)
                .delete(`/api/shops/${shopToDeleteId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/Shop deleted successfully/i);

            // 2. Comprobar directamente en la base de datos que la fila SIGUE EXISTIENDO pero is_active = false
            const pool = getPool();
            const dbCheck = await pool.query('SELECT id, is_active FROM shops WHERE id = $1', [shopToDeleteId]);

            expect(dbCheck.rows.length).toBe(1);
            expect(dbCheck.rows[0].is_active).toBe(false);

            // 3. Comprobar que GET /api/shops/:id ahora responde 404 porque está inactiva
            const getCheck = await request(app).get(`/api/shops/${shopToDeleteId}`);
            expect(getCheck.status).toBe(404);
            expect(getCheck.body.message).toMatch(/not found or is inactive/i);
        });
    });
});
