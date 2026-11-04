import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import {
    insertManager,
    insertUser,
    insertShop,
    insertReceptionist,
    cleanupFixtures,
    generateUniqueFixtureName,
    getSeededShiftId,
} from './helpers/availabilityFixtures.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

// Configuración de la app de Express
const app = express();
app.use(express.json());
app.use('/api', router);

// Función para generar JWT
const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

// Helpers locales para insertar categorías e insumos rápido en BD para los tests
const insertCategory = async (name: string): Promise<string> => {
    const res = await getPool().query(
        `INSERT INTO supplies_categories (name, description) VALUES ($1, $2) RETURNING id`,
        [name, 'Categoría base para tests de insumos']
    );
    return res.rows[0].id;
};

const insertSupply = async (
    shopId: string,
    categoryId: string,
    name: string,
    sku: string | null = null
): Promise<string> => {
    const res = await getPool().query(
        `INSERT INTO supplies (shop_id, category_id, name, unit, sku) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [shopId, categoryId, name, 'unit', sku]
    );
    return res.rows[0].id;
};

describe('Pruebas de endpoints de Insumos (Supplies) - Completo', () => {
    let dummyManager: { id: string; email: string };
    let dummyReceptionist: { id: string; email: string };
    let clientUser: { id: string; email: string };
    let otherManager: { id: string; email: string };

    let managerToken: string;
    let receptionistToken: string;
    let clientToken: string;
    let otherManagerToken: string;
    let unassignedManagerToken: string;

    let shopId1: string;
    let shopId2: string;
    let otherShopId: string;
    let otherSupplyId: string;
    let categoryId: string;
    let initialSupplyId: string;

    const createdSupplyIds: string[] = [];

    beforeAll(async () => {
        await connectDB();

        // 1. Crear usuarios y tokens
        dummyManager = await insertManager();
        clientUser = await insertUser('client');
        otherManager = await insertManager();
        const unassignedManager = await insertManager(); // gerente sin sucursales

        managerToken = mintToken(dummyManager.id, 'manager', dummyManager.email);
        clientToken = mintToken(clientUser.id, 'client', clientUser.email);
        otherManagerToken = mintToken(otherManager.id, 'manager', otherManager.email);
        unassignedManagerToken = mintToken(unassignedManager.id, 'manager', unassignedManager.email);

        // 2. Crear Sucursales y Categoría
        shopId1 = await insertShop(dummyManager.id, { name: generateUniqueFixtureName('ShopSupp1') });
        shopId2 = await insertShop(dummyManager.id, { name: generateUniqueFixtureName('ShopSupp2') });
        otherShopId = await insertShop(otherManager.id, { name: generateUniqueFixtureName('ShopSuppOther') });
        categoryId = await insertCategory(generateUniqueFixtureName('CatSupp'));

        // La recepcionista trabaja únicamente en shopId1
        const shiftId = await getSeededShiftId();
        dummyReceptionist = await insertReceptionist(shopId1, shiftId);
        receptionistToken = mintToken(dummyReceptionist.id, 'receptionist', dummyReceptionist.email);

        // 3. Crear insumos iniciales para tests de lectura y conflictos
        initialSupplyId = await insertSupply(shopId1, categoryId, 'Insumo Inicial', 'SKU-INICIAL');
        createdSupplyIds.push(initialSupplyId);
        otherSupplyId = await insertSupply(otherShopId, categoryId, 'Insumo Otra Sucursal');
        createdSupplyIds.push(otherSupplyId);
    });

    afterAll(async () => {
        const pool = getPool();
        if (createdSupplyIds.length > 0) {
            await pool.query('DELETE FROM supplies WHERE id = ANY($1)', [createdSupplyIds]);
        }
        await pool.query('DELETE FROM supplies_categories WHERE id = $1', [categoryId]);

        await cleanupFixtures();
        await closeDB();
    });

    describe('Crear Insumo (POST /api/supplies)', () => {
        test('Debe responder 201 y permitir a un MANAGER crear un insumo', async () => {
            const data = {
                shopId: shopId1,
                categoryId: categoryId,
                name: 'Toallas Blancas',
                sku: 'TOA-001',
                unit: 'piece',
            };

            const res = await request(app)
                .post('/api/supplies')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(data);

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe(data.name);
            createdSupplyIds.push(res.body.data.id);
        });

        test('Debe responder 201 si una RECEPCIONISTA intenta crear un insumo', async () => {
            const data = {
                shopId: shopId1,
                categoryId: categoryId,
                name: 'Gel Capilar',
                sku: 'GEL-001',
                unit: 'unit',
            };

            const res = await request(app)
                .post('/api/supplies')
                .set('Authorization', `Bearer ${receptionistToken}`)
                .send(data);

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe(data.name);
            createdSupplyIds.push(res.body.data.id);
        });

        test('Debe responder 403 si un CLIENTE intenta crear un insumo', async () => {
            const res = await request(app)
                .post('/api/supplies')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ shopId: shopId1, categoryId, name: 'Hacker' });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized/i);
        });

        test('Debe responder 409 si el nombre ya existe en la MISMA sucursal', async () => {
            const res = await request(app)
                .post('/api/supplies')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ shopId: shopId1, categoryId, name: 'Insumo Inicial' });

            expect(res.status).toBe(409);
        });

        test('Debe responder 201 y permitir usar el MISMO NOMBRE pero en DIFERENTE sucursal', async () => {
            const res = await request(app)
                .post('/api/supplies')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ shopId: shopId2, categoryId, name: 'Insumo Inicial', sku: 'SKU-DIFERENTE' });

            expect(res.status).toBe(201);
            createdSupplyIds.push(res.body.data.id);
        });

        test('Debe responder 409 si el SKU ya existe en la MISMA sucursal', async () => {
            const res = await request(app)
                .post('/api/supplies')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ shopId: shopId1, categoryId, name: 'Otro Insumo', sku: 'SKU-INICIAL' });

            expect(res.status).toBe(409);
        });

        test('Debe responder 400 si falta un campo requerido', async () => {
            const res = await request(app)
                .post('/api/supplies')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ shopId: shopId1, categoryId }); // Falta el nombre

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
    });

    describe('Listar y Consultar Insumos (GET /api/supplies)', () => {
        const shopIdsOf = (res: request.Response): Set<string> =>
            new Set(res.body.data.map((supply: any) => supply.shop_id));

        test('Debe responder 200 y listar solo los insumos de las sucursales del MANAGER si no se envía shopIds', async () => {
            const res = await request(app).get('/api/supplies').set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            const shops = shopIdsOf(res);
            expect(shops.has(shopId1)).toBe(true);
            expect(shops.has(shopId2)).toBe(true);
            expect(shops.has(otherShopId)).toBe(false);
        });

        test('Debe responder 200 y listar solo los insumos de la sucursal de la RECEPCIONISTA si no se envía shopIds', async () => {
            const res = await request(app).get('/api/supplies').set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(shopIdsOf(res)).toEqual(new Set([shopId1]));
        });

        test('Debe responder 200 y una lista vacía si el MANAGER no tiene sucursales asignadas', async () => {
            const res = await request(app).get('/api/supplies').set('Authorization', `Bearer ${unassignedManagerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });

        test('Debe responder 403 si un CLIENTE intenta listar insumos', async () => {
            const res = await request(app).get('/api/supplies').set('Authorization', `Bearer ${clientToken}`);
            expect(res.status).toBe(403);
        });

        test('Debe responder 200 y filtrar correctamente por shopIds (MANAGER)', async () => {
            const res = await request(app)
                .get(`/api/supplies?shopIds=${shopId2}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(shopIdsOf(res)).toEqual(new Set([shopId2]));
        });

        test('Debe responder 200 y filtrar por varias sucursales (shopIds repetido y separado por comas)', async () => {
            const repeated = await request(app)
                .get(`/api/supplies?shopIds=${shopId1}&shopIds=${shopId2}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(repeated.status).toBe(200);
            expect(shopIdsOf(repeated)).toEqual(new Set([shopId1, shopId2]));

            const csv = await request(app)
                .get(`/api/supplies?shopIds=${shopId1},${shopId2}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(csv.status).toBe(200);
            expect(shopIdsOf(csv)).toEqual(new Set([shopId1, shopId2]));
        });

        test('Debe responder 200 si la RECEPCIONISTA solicita su propia sucursal en shopIds', async () => {
            const res = await request(app)
                .get(`/api/supplies?shopIds=${shopId1}`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
            expect(shopIdsOf(res)).toEqual(new Set([shopId1]));
        });

        test('Debe responder 403 si la RECEPCIONISTA solicita una sucursal que no es la suya', async () => {
            const res = await request(app)
                .get(`/api/supplies?shopIds=${shopId2}`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(403);
        });

        test('Debe responder 403 si el MANAGER solicita una sucursal que no administra', async () => {
            const res = await request(app)
                .get(`/api/supplies?shopIds=${otherShopId}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(403);
        });

        test('Debe responder 403 si al menos una de las sucursales de shopIds no está asignada', async () => {
            const res = await request(app)
                .get(`/api/supplies?shopIds=${shopId1}&shopIds=${otherShopId}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(403);
        });

        test('Debe responder 200 si otro MANAGER solicita su propia sucursal', async () => {
            const res = await request(app)
                .get(`/api/supplies?shopIds=${otherShopId}`)
                .set('Authorization', `Bearer ${otherManagerToken}`);
            expect(res.status).toBe(200);
            expect(shopIdsOf(res)).toEqual(new Set([otherShopId]));
        });

        test('Debe responder 400 si shopIds contiene un UUID inválido', async () => {
            const res = await request(app)
                .get('/api/supplies?shopIds=not-a-uuid')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(400);
        });

        test('Debe responder 200 y obtener detalles de un insumo por su ID (MANAGER)', async () => {
            const res = await request(app)
                .get(`/api/supplies/${initialSupplyId}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(initialSupplyId);
        });

        test('Debe responder 200 si una RECEPCIONISTA intenta obtener detalles de un insumo por ID', async () => {
            const res = await request(app)
                .get(`/api/supplies/${initialSupplyId}`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(initialSupplyId);
        });

        test('Debe responder 404 si el insumo no existe (MANAGER)', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .get(`/api/supplies/${fakeUuid}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('Editar Insumo (PUT /api/supplies/:id)', () => {
        let supplyToEditId: string;

        beforeAll(async () => {
            supplyToEditId = await insertSupply(shopId1, categoryId, 'Insumo Para Editar', 'SKU-EDIT');
            createdSupplyIds.push(supplyToEditId);
        });

        test('Debe responder 200 y actualizar los campos (MANAGER)', async () => {
            const res = await request(app)
                .put(`/api/supplies/${supplyToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: 'Editado Manager', unit: 'box' });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Editado Manager');
        });

        test('Debe responder 200 si una RECEPCIONISTA intenta editar un insumo', async () => {
            const res = await request(app)
                .put(`/api/supplies/${supplyToEditId}`)
                .set('Authorization', `Bearer ${receptionistToken}`)
                .send({ name: 'Editado Recepcionista' });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Editado Recepcionista');
        });

        test('Debe responder 403 si un CLIENTE intenta editar', async () => {
            const res = await request(app)
                .put(`/api/supplies/${supplyToEditId}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ name: 'Hack Edit' });

            expect(res.status).toBe(403);
        });

        test('Debe responder 409 si se edita el SKU a uno que ya existe en la MISMA sucursal', async () => {
            const res = await request(app)
                .put(`/api/supplies/${supplyToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ sku: 'SKU-INICIAL' });

            expect(res.status).toBe(409);
        });
    });

    describe('Eliminar Insumo (DELETE /api/supplies/:id)', () => {
        let supplyForManager: string;
        let supplyForReceptionist: string;

        beforeAll(async () => {
            supplyForManager = await insertSupply(shopId1, categoryId, 'Borrar por Manager');
            supplyForReceptionist = await insertSupply(shopId1, categoryId, 'Borrar por Recepcionista');
            createdSupplyIds.push(supplyForManager, supplyForReceptionist); // Agregados al arreglo para limpiar la BD
        });

        test('Debe responder 403 si un CLIENTE intenta eliminar el insumo', async () => {
            const res = await request(app)
                .delete(`/api/supplies/${supplyForManager}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
        });

        test('Debe responder 200 si una RECEPCIONISTA intenta eliminar el insumo', async () => {
            const res = await request(app)
                .delete(`/api/supplies/${supplyForReceptionist}`)
                .set('Authorization', `Bearer ${receptionistToken}`);

            expect(res.status).toBe(200);
        });

        test('Debe responder 200 y realizar borrado físico con token de MANAGER', async () => {
            const res = await request(app)
                .delete(`/api/supplies/${supplyForManager}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
        });

        test('Debe responder 404 si se intenta eliminar un insumo que ya fue borrado', async () => {
            const res = await request(app)
                .delete(`/api/supplies/${supplyForManager}`) // Ya se borró arriba
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(404);
        });
    });
});
