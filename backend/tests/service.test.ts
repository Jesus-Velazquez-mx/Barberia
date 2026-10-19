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

// Configuración de la aplicación Express para pruebas
const app = express();
app.use(express.json());
app.use('/api', router);

// Función utilitaria para generar tokens JWT de prueba
const mintToken = (id: string, role: UserRole, email: string): string =>
    signToken({ id, role, email } as User);

describe('Pruebas de endpoints de Servicios (Services)', () => {
    let dummyManager: { id: string; email: string };
    let clientUser: { id: string; email: string };
    let managerToken: string;
    let clientToken: string;

    let categoryId1: string;
    let categoryId2: string;
    let serviceId1: string;
    let serviceId2: string;

    const createdCategoryIds: string[] = [];
    const createdServiceIds: string[] = [];

    beforeAll(async () => {
        await connectDB();

        // 1. Crear usuarios y tokens para pruebas de autenticación y autorización
        dummyManager = await insertManager();
        clientUser = await insertUser('client');

        managerToken = mintToken(dummyManager.id, 'manager', dummyManager.email);
        clientToken = mintToken(clientUser.id, 'client', clientUser.email);

        // 2. Insertar categorías de prueba
        categoryId1 = await insertServiceCategory(generateUniqueFixtureName('CatSvc1'));
        categoryId2 = await insertServiceCategory(generateUniqueFixtureName('CatSvc2'));
        createdCategoryIds.push(categoryId1, categoryId2);

        // 3. Insertar servicios base para pruebas de consulta
        serviceId1 = await insertService({
            categoryId: categoryId1,
            name: generateUniqueFixtureName('CorteClasico'),
            durationMinutes: 30,
            price: 250,
        });
        serviceId2 = await insertService({
            categoryId: categoryId2,
            name: generateUniqueFixtureName('AfeitadoNavaja'),
            durationMinutes: 20,
            price: 180,
        });
        createdServiceIds.push(serviceId1, serviceId2);
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

    describe('Listar Servicios (GET /api/services)', () => {
        test('Debe responder 200 y listar los servicios para un usuario manager', async () => {
            const res = await request(app)
                .get('/api/services')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            const foundSvc1 = res.body.data.find((s: any) => s.id === serviceId1);
            expect(foundSvc1).toBeDefined();
            expect(foundSvc1.categoryId).toBe(categoryId1);

            const foundSvc2 = res.body.data.find((s: any) => s.id === serviceId2);
            expect(foundSvc2).toBeDefined();
            expect(foundSvc2.categoryId).toBe(categoryId2);
        });

        test('Debe responder 200 y filtrar servicios por categoría', async () => {
            const res = await request(app)
                .get(`/api/services?categoryId=${categoryId1}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            const foundSvc1 = res.body.data.find((s: any) => s.id === serviceId1);
            expect(foundSvc1).toBeDefined();

            const foundSvc2 = res.body.data.find((s: any) => s.id === serviceId2);
            expect(foundSvc2).toBeUndefined();
        });

        test('Debe responder 200 y filtrar servicios por estado activo', async () => {
            const res = await request(app)
                .get('/api/services?isActive=true')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            res.body.data.forEach((svc: any) => {
                expect(svc.isActive).toBe(true);
            });
        });

        test('Debe responder 400 si el parámetro categoryId no tiene formato UUID', async () => {
            const res = await request(app)
                .get('/api/services?categoryId=invalid-uuid')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Validation error/i);
            expect(JSON.stringify(res.body.error)).toMatch(/Invalid category ID format/i);
        });

        test('Debe responder 403 si un cliente intenta listar los servicios administrativos', async () => {
            const res = await request(app)
                .get('/api/services')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized/i);
        });

        test('Debe responder 401 si no se envía token de autenticación', async () => {
            const res = await request(app).get('/api/services');

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Missing or invalid authorization token/i);
        });
    });

    describe('Obtener Servicio por ID (GET /api/services/:id)', () => {
        test('Debe responder 200 y retornar los detalles del servicio solicitado', async () => {
            const res = await request(app)
                .get(`/api/services/${serviceId1}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(serviceId1);
            expect(res.body.data.categoryId).toBe(categoryId1);
            expect(res.body.data.durationMinutes).toBe(30);
            expect(Number(res.body.data.price)).toBe(250);
            expect(res.body.data.isActive).toBe(true);
        });

        test('Debe responder 404 si el servicio solicitado no existe', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .get(`/api/services/${nonExistentId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Service not found/i);
        });

        test('Debe responder 400 si el parámetro de ID no es un UUID válido', async () => {
            const res = await request(app)
                .get('/api/services/123-abc')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Validation error/i);
            expect(JSON.stringify(res.body.error)).toMatch(/Invalid service ID format/i);
        });

        test('Debe responder 403 si un cliente intenta consultar el servicio', async () => {
            const res = await request(app)
                .get(`/api/services/${serviceId1}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized/i);
        });

        test('Debe responder 401 si no se incluye token de autenticación', async () => {
            const res = await request(app).get(`/api/services/${serviceId1}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Missing or invalid authorization token/i);
        });
    });

    describe('Registrar Servicio (POST /api/services)', () => {
        test('Debe responder 201 y crear un nuevo servicio correctamente', async () => {
            const newServiceName = generateUniqueFixtureName('CortePompadour');
            const newServiceData = {
                categoryId: categoryId1,
                name: newServiceName,
                description: 'Estilo clásico con acabado moderno',
                durationMinutes: 45,
                price: 320.5,
                isActive: true,
            };

            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(newServiceData);

            expect(res.status).toBe(201);
            expect(res.body.data).toBeDefined();
            expect(res.body.data.name).toBe(newServiceName);
            expect(res.body.data.categoryId).toBe(categoryId1);
            expect(res.body.data.durationMinutes).toBe(45);
            expect(Number(res.body.data.price)).toBe(320.5);
            expect(res.body.data.isActive).toBe(true);

            createdServiceIds.push(res.body.data.id);
        });

        test('Debe responder 409 si ya existe un servicio con el mismo nombre', async () => {
            // Intentar registrar con el mismo nombre del servicio 1
            const pool = getPool();
            const svcRecord = await pool.query('SELECT name FROM services WHERE id = $1', [serviceId1]);
            const existingName = svcRecord.rows[0].name;

            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryId: categoryId1,
                    name: existingName,
                    durationMinutes: 40,
                    price: 200,
                });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/Service name is already in use/i);
        });

        test('Debe responder 404 si la categoría asignada no existe', async () => {
            const fakeCategoryId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryId: fakeCategoryId,
                    name: generateUniqueFixtureName('CorteInvalido'),
                    durationMinutes: 30,
                    price: 200,
                });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Service category not found/i);
        });

        test('Debe responder 400 si faltan campos obligatorios en el registro', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryId: categoryId1,
                    // name ausente
                    price: 200,
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        test('Debe responder 400 si la duración o el precio son negativos o inválidos', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryId: categoryId1,
                    name: generateUniqueFixtureName('CorteNegativo'),
                    durationMinutes: -15,
                    price: -50,
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        test('Debe responder 403 si un cliente intenta registrar un servicio', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    categoryId: categoryId1,
                    name: generateUniqueFixtureName('CorteCliente'),
                    durationMinutes: 30,
                    price: 200,
                });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized/i);
        });

        test('Debe responder 401 si no se envía token de autenticación', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({
                    categoryId: categoryId1,
                    name: generateUniqueFixtureName('CorteNoAuth'),
                    durationMinutes: 30,
                    price: 200,
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Missing or invalid authorization token/i);
        });
    });

    describe('Editar Servicio (PUT /api/services/:id)', () => {
        let serviceToEditId: string;

        beforeAll(async () => {
            serviceToEditId = await insertService({
                categoryId: categoryId1,
                name: generateUniqueFixtureName('SvcToEdit'),
                durationMinutes: 25,
                price: 150,
            });
            createdServiceIds.push(serviceToEditId);
        });

        test('Debe responder 200 y actualizar los campos correctamente', async () => {
            const updatedName = generateUniqueFixtureName('SvcEdited');
            const res = await request(app)
                .put(`/api/services/${serviceToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    name: updatedName,
                    price: 220,
                    durationMinutes: 35,
                    description: 'Descripción actualizada',
                    categoryId: categoryId2,
                });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe(updatedName);
            expect(Number(res.body.data.price)).toBe(220);
            expect(res.body.data.durationMinutes).toBe(35);
            expect(res.body.data.description).toBe('Descripción actualizada');
            expect(res.body.data.categoryId).toBe(categoryId2);
        });

        test('Debe responder 404 si el servicio a actualizar no existe', async () => {
            const fakeId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .put(`/api/services/${fakeId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ price: 300 });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Service not found/i);
        });

        test('Debe responder 404 si se intenta asociar una categoría inexistente', async () => {
            const fakeCategoryId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .put(`/api/services/${serviceToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ categoryId: fakeCategoryId });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Service category not found/i);
        });

        test('Debe responder 409 si se intenta renombrar con el nombre de otro servicio existente', async () => {
            const pool = getPool();
            const svcRecord = await pool.query('SELECT name FROM services WHERE id = $1', [serviceId1]);
            const targetName = svcRecord.rows[0].name;

            const res = await request(app)
                .put(`/api/services/${serviceToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: targetName });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/Service name is already in use/i);
        });

        test('Debe responder 400 si se envía un cuerpo vacío sin campos a modificar', async () => {
            const res = await request(app)
                .put(`/api/services/${serviceToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Validation error/i);
            expect(JSON.stringify(res.body.error)).toMatch(/At least one field must be provided for update/i);
        });

        test('Debe responder 403 si un cliente intenta actualizar un servicio', async () => {
            const res = await request(app)
                .put(`/api/services/${serviceToEditId}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ price: 350 });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized/i);
        });

        test('Debe responder 401 si no se envía token de autenticación', async () => {
            const res = await request(app)
                .put(`/api/services/${serviceToEditId}`)
                .send({ price: 350 });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Missing or invalid authorization token/i);
        });
    });

    describe('Eliminar Servicio (DELETE /api/services/:id)', () => {
        let serviceToDeleteId: string;

        beforeAll(async () => {
            serviceToDeleteId = await insertService({
                categoryId: categoryId1,
                name: generateUniqueFixtureName('SvcToDelete'),
                durationMinutes: 20,
                price: 100,
            });
            createdServiceIds.push(serviceToDeleteId);
        });

        test('Debe responder 200 y realizar el borrado LÓGICO del servicio', async () => {
            const res = await request(app)
                .delete(`/api/services/${serviceToDeleteId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/Service deleted successfully/i);

            // Verificar que la fila aún existe físicamente en BD pero con is_active = false
            const pool = getPool();
            const dbCheck = await pool.query('SELECT id, is_active FROM services WHERE id = $1', [serviceToDeleteId]);

            expect(dbCheck.rows.length).toBe(1);
            expect(dbCheck.rows[0].is_active).toBe(false);
        });

        test('Debe responder 404 si el servicio a eliminar no existe', async () => {
            const fakeId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .delete(`/api/services/${fakeId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Service not found/i);
        });

        test('Debe responder 400 si el parámetro ID tiene formato inválido', async () => {
            const res = await request(app)
                .delete('/api/services/non-uuid')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Validation error/i);
            expect(JSON.stringify(res.body.error)).toMatch(/Invalid service ID format/i);
        });

        test('Debe responder 403 si un cliente intenta eliminar el servicio', async () => {
            const res = await request(app)
                .delete(`/api/services/${serviceToDeleteId}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized/i);
        });

        test('Debe responder 401 si no se envía token de autenticación', async () => {
            const res = await request(app).delete(`/api/services/${serviceToDeleteId}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Missing or invalid authorization token/i);
        });
    });
});
