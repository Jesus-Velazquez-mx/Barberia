import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import {
    insertManager,
    insertUser,
    insertServiceCategory,
    insertService,
    cleanupFixtures,
    generateUniqueFixtureName,
} from './helpers/availabilityFixtures.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

describe('Pruebas de endpoints de Categorías de Servicios (Service Categories)', () => {
    let dummyManager: { id: string; email: string };
    let clientUser: { id: string; email: string };
    let managerToken: string;
    let clientToken: string;

    let categoryId1: string;
    let categoryId2: string;
    let inactiveCategoryId: string;

    const createdCategoryIds: string[] = [];
    const createdServiceIds: string[] = [];

    beforeAll(async () => {
        await connectDB();

        // 1. Crear usuarios y tokens para las pruebas de autorización
        dummyManager = await insertManager();
        clientUser = await insertUser('client');

        managerToken = mintToken(dummyManager.id, 'manager', dummyManager.email);
        clientToken = mintToken(clientUser.id, 'client', clientUser.email);

        // 2. Insertar categorías base para probar consultas
        categoryId1 = await insertServiceCategory(generateUniqueFixtureName('CatA'));
        categoryId2 = await insertServiceCategory(generateUniqueFixtureName('CatZ'));

        // Categoría inactiva para probar el filtrado en GET
        const pool = getPool();
        inactiveCategoryId = await insertServiceCategory(generateUniqueFixtureName('CatInactiva'));
        await pool.query('UPDATE services_categories SET is_active = false WHERE id = $1', [inactiveCategoryId]);

        createdCategoryIds.push(categoryId1, categoryId2, inactiveCategoryId);
    });

    afterAll(async () => {
        const pool = getPool();
        if (createdServiceIds.length > 0) {
            await pool.query('DELETE FROM services WHERE id = ANY($1)', [createdServiceIds]);
        }
        if (createdCategoryIds.length > 0) {
            await pool.query('DELETE FROM services_categories WHERE id = ANY($1)', [createdCategoryIds]);
        }
        await cleanupFixtures();
        await closeDB();
    });

    describe('Listar Categorías (GET /api/servicesCategories)', () => {
        test('Debe responder 200 y listar todas las categorías (activas e inactivas) para un usuario manager', async () => {
            const res = await request(app)
                .get('/api/servicesCategories')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            const catIds = res.body.data.map((c: any) => c.id);
            expect(catIds).toContain(categoryId1);
            expect(catIds).toContain(categoryId2);
            expect(catIds).toContain(inactiveCategoryId); // Manager ve la inactiva
        });

        test('Debe responder 200 y listar SOLO categorías activas para un usuario cliente', async () => {
            const res = await request(app).get('/api/servicesCategories').set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            const catIds = res.body.data.map((c: any) => c.id);
            expect(catIds).toContain(categoryId1);
            expect(catIds).toContain(categoryId2);
            expect(catIds).not.toContain(inactiveCategoryId); // Cliente NO ve la inactiva
        });

        test('Debe responder 401 si no se envía token de autenticación', async () => {
            const res = await request(app).get('/api/servicesCategories');

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Missing or invalid authorization token/i);
        });
    });

    describe('Obtener Categoría por ID (GET /api/servicesCategories/:id)', () => {
        test('Debe responder 200 y retornar la información de la categoría activa para un cliente', async () => {
            const res = await request(app)
                .get(`/api/servicesCategories/${categoryId1}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeDefined();
            expect(res.body.data.id).toBe(categoryId1);
        });

        test('Debe responder 404 cuando un cliente intenta consultar una categoría inactiva', async () => {
            const res = await request(app)
                .get(`/api/servicesCategories/${inactiveCategoryId}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Category not found/i);
        });

        test('Debe responder 404 cuando la categoría no existe en el sistema', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .get(`/api/servicesCategories/${fakeUuid}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Category not found/i);
        });

        test('Debe responder 400 cuando el ID proporcionado no tiene formato UUID', async () => {
            const res = await request(app)
                .get('/api/servicesCategories/id-invalido')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        test('Debe responder 401 si no se envía el header de autorización', async () => {
            const res = await request(app).get(`/api/servicesCategories/${categoryId1}`);

            expect(res.status).toBe(401);
        });
    });

    describe('Registrar Categoría (POST /api/servicesCategories)', () => {
        test('Debe responder 201 y crear una nueva categoría para un manager', async () => {
            const newCategoryData = {
                name: generateUniqueFixtureName('CatCreate'),
                description: 'Categoría para estilos y cortes especializados',
            };

            const res = await request(app)
                .post('/api/servicesCategories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(newCategoryData);

            expect(res.status).toBe(201);
            expect(res.body.data).toBeDefined();
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.name).toBe(newCategoryData.name);
            expect(res.body.data.description).toBe(newCategoryData.description);

            createdCategoryIds.push(res.body.data.id);
        });

        test('Debe responder 409 si el nombre de la categoría ya existe', async () => {
            const existingCat = await getPool().query('SELECT name FROM services_categories WHERE id = $1', [
                categoryId1,
            ]);
            const existingName = existingCat.rows[0].name;

            const res = await request(app)
                .post('/api/servicesCategories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: existingName });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/already in use/i);
        });

        test('Debe responder 400 si falta el campo obligatorio name', async () => {
            const res = await request(app)
                .post('/api/servicesCategories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ description: 'Sin nombre' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        test('Debe responder 403 si un cliente intenta registrar una categoría', async () => {
            const res = await request(app)
                .post('/api/servicesCategories')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ name: 'Cliente Categoría' });

            expect(res.status).toBe(403);
        });

        test('Debe responder 401 si no se envía token de autenticación', async () => {
            const res = await request(app).post('/api/servicesCategories').send({ name: 'Sin Token' });

            expect(res.status).toBe(401);
        });
    });

    describe('Editar Categoría (PUT /api/servicesCategories/:id)', () => {
        let categoryToEditId: string;
        let categoryForCascadeId: string;
        let associatedServiceId1: string;
        let associatedServiceId2: string;

        beforeAll(async () => {
            categoryToEditId = await insertServiceCategory(generateUniqueFixtureName('CatEdit'));
            createdCategoryIds.push(categoryToEditId);

            // Preparación para la prueba de desactivación en cascada
            categoryForCascadeId = await insertServiceCategory(generateUniqueFixtureName('CatCascade'));
            createdCategoryIds.push(categoryForCascadeId);

            associatedServiceId1 = await insertService({
                categoryId: categoryForCascadeId,
                name: generateUniqueFixtureName('SvcC1'),
            });
            associatedServiceId2 = await insertService({
                categoryId: categoryForCascadeId,
                name: generateUniqueFixtureName('SvcC2'),
            });
            createdServiceIds.push(associatedServiceId1, associatedServiceId2);
        });

        test('Debe responder 200 y actualizar correctamente el nombre y la descripción', async () => {
            const updatedData = {
                name: generateUniqueFixtureName('CatEdited'),
                description: 'Descripción actualizada correctamente',
            };

            const res = await request(app)
                .put(`/api/servicesCategories/${categoryToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send(updatedData);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(categoryToEditId);
            expect(res.body.data.name).toBe(updatedData.name);
            expect(res.body.data.description).toBe(updatedData.description);
        });

        test('Debe desactivar EN CASCADA todos los servicios asociados si isActive se actualiza a false', async () => {
            // Confirmamos que los servicios están activos inicialmente
            const pool = getPool();
            const checkInitial = await pool.query('SELECT is_active FROM services WHERE id IN ($1, $2)', [
                associatedServiceId1,
                associatedServiceId2,
            ]);
            expect(checkInitial.rows[0].is_active).toBe(true);
            expect(checkInitial.rows[1].is_active).toBe(true);

            // Desactivamos la categoría
            const res = await request(app)
                .put(`/api/servicesCategories/${categoryForCascadeId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ isActive: false });

            expect(res.status).toBe(200);

            // Verificamos en BD que los servicios se desactivaron
            const checkFinal = await pool.query('SELECT is_active FROM services WHERE id IN ($1, $2)', [
                associatedServiceId1,
                associatedServiceId2,
            ]);
            expect(checkFinal.rows[0].is_active).toBe(false);
            expect(checkFinal.rows[1].is_active).toBe(false);

            // Verificamos que los servicios ya no aparezcan listados para el cliente
            const clientRes = await request(app)
                .get(`/api/offeredServices?categoryId=${categoryForCascadeId}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(clientRes.body.data.length).toBe(0);
        });

        test('Debe responder 404 si la categoría a editar no existe', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .put(`/api/servicesCategories/${fakeUuid}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: 'Nuevo Nombre' });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Category not found/i);
        });

        test('Debe responder 409 si se intenta actualizar al nombre de otra categoría existente', async () => {
            const existingCat = await getPool().query('SELECT name FROM services_categories WHERE id = $1', [
                categoryId1,
            ]);
            const duplicateName = existingCat.rows[0].name;

            const res = await request(app)
                .put(`/api/servicesCategories/${categoryToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: duplicateName });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/already in use/i);
        });

        test('Debe responder 400 si el cuerpo de actualización está vacío', async () => {
            const res = await request(app)
                .put(`/api/servicesCategories/${categoryToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error[0].detail).toMatch(/At least one field must be provided/i);
        });

        test('Debe responder 403 si un cliente intenta editar la categoría', async () => {
            const res = await request(app)
                .put(`/api/servicesCategories/${categoryToEditId}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ name: 'Cliente Update' });

            expect(res.status).toBe(403);
        });

        test('Debe responder 401 si no se envía token de autenticación', async () => {
            const res = await request(app)
                .put(`/api/servicesCategories/${categoryToEditId}`)
                .send({ name: 'Sin Token' });

            expect(res.status).toBe(401);
        });
    });

    describe('Eliminar Categoría (DELETE /api/servicesCategories/:id)', () => {
        let emptyCategoryId: string;
        let categoryWithServicesId: string;

        beforeAll(async () => {
            // Categoría sin servicios asociados para probar eliminación exitosa
            emptyCategoryId = await insertServiceCategory(generateUniqueFixtureName('CatEmpty'));
            createdCategoryIds.push(emptyCategoryId);

            // Categoría con servicio vinculado para probar restricción de llave foránea
            categoryWithServicesId = await insertServiceCategory(generateUniqueFixtureName('CatWithSvc'));
            createdCategoryIds.push(categoryWithServicesId);

            const svcId = await insertService({ categoryId: categoryWithServicesId });
            createdServiceIds.push(svcId);
        });

        test('Debe responder 404 si la categoría a eliminar no existe', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .delete(`/api/servicesCategories/${fakeUuid}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Category not found/i);
        });

        test('Debe responder 200 y desactivar la categoría (sin borrarla) cuando no tiene servicios', async () => {
            const res = await request(app)
                .delete(`/api/servicesCategories/${emptyCategoryId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/Category deleted successfully/i);

            // La fila debe conservarse con is_active = false
            const pool = getPool();
            const check = await pool.query('SELECT is_active FROM services_categories WHERE id = $1', [
                emptyCategoryId,
            ]);
            expect(check.rows.length).toBe(1);
            expect(check.rows[0].is_active).toBe(false);
        });

        test('Debe responder 200 y desactivar la categoría junto con todos sus servicios', async () => {
            const res = await request(app)
                .delete(`/api/servicesCategories/${categoryWithServicesId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);

            const pool = getPool();
            const category = await pool.query('SELECT is_active FROM services_categories WHERE id = $1', [
                categoryWithServicesId,
            ]);
            expect(category.rows[0].is_active).toBe(false);

            const services = await pool.query('SELECT is_active FROM services WHERE category_id = $1', [
                categoryWithServicesId,
            ]);
            expect(services.rows.length).toBeGreaterThan(0);
            expect(services.rows.every((s) => s.is_active === false)).toBe(true);
        });

        test('Debe ser idempotente: responder 200 al eliminar una categoría ya inactiva', async () => {
            const res = await request(app)
                .delete(`/api/servicesCategories/${emptyCategoryId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
        });

        test('Debe responder 403 si un cliente intenta eliminar la categoría', async () => {
            const res = await request(app)
                .delete(`/api/servicesCategories/${categoryWithServicesId}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
        });

        test('Debe responder 401 si no se envía token de autenticación', async () => {
            const res = await request(app).delete(`/api/servicesCategories/${categoryWithServicesId}`);

            expect(res.status).toBe(401);
        });
    });
});
