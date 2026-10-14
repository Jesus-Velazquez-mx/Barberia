import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getActiveServices, getServiceById } from '../src/repositories/offeredServiceRepository.js';
import { insertService, insertServiceCategory, cleanupFixtures } from './helpers/availabilityFixtures.js';

const { connectDB, closeDB } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

describe('Endpoints de Catálogo de Servicios (OfferedServices)', () => {
    let categoryId: string;
    let activeServiceAlphaId: string;
    let activeServiceBetaId: string;
    let inactiveServiceId: string;

    beforeAll(async () => {
        await connectDB();

        // 1. Crear una categoría de prueba usando el fixture
        categoryId = await insertServiceCategory();

        // 2. Crear servicios de prueba (2 activos para verificar el orden alfabético y 1 inactivo)
        activeServiceBetaId = await insertService({
            categoryId,
            name: 'AAA_Test_Beta Service',
            durationMinutes: 45,
            price: 300.0,
            isActive: true,
        });

        activeServiceAlphaId = await insertService({
            categoryId,
            name: 'AAA_Test_Alpha Service',
            durationMinutes: 30,
            price: 250.0,
            isActive: true,
        });

        inactiveServiceId = await insertService({
            categoryId,
            name: 'AAA_Test_Inactive Service',
            durationMinutes: 30,
            price: 200.0,
            isActive: false,
        });
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    describe('Repositorio: offeredServiceRepository', () => {
        test('getActiveServices debe retornar SOLO servicios activos y ordenados por nombre ASC', async () => {
            const services = await getActiveServices();
            const returnedIds = services.map((s) => s.id);

            expect(returnedIds).toContain(activeServiceAlphaId);
            expect(returnedIds).toContain(activeServiceBetaId);
            expect(returnedIds).not.toContain(inactiveServiceId);

            // Verificar que Alpha aparece antes que Beta por el ORDER BY name ASC
            const alphaIndex = returnedIds.indexOf(activeServiceAlphaId);
            const betaIndex = returnedIds.indexOf(activeServiceBetaId);
            expect(alphaIndex).toBeLessThan(betaIndex);
        });

        test('getServiceById debe retornar el servicio (activo o inactivo) o null si no existe', async () => {
            const active = await getServiceById(activeServiceAlphaId);
            expect(active).not.toBeNull();
            expect(active?.id).toBe(activeServiceAlphaId);

            const inactive = await getServiceById(inactiveServiceId);
            expect(inactive).not.toBeNull();
            expect(inactive?.is_active).toBe(false);

            const nonExistent = await getServiceById('550e8400-e29b-41d4-a716-446655440000');
            expect(nonExistent).toBeNull();
        });
    });

    describe('GET /api/offeredServices', () => {
        test('Debe responder 200 y devolver solo los servicios activos mapeados a camelCase', async () => {
            const res = await request(app).get('/api/offeredServices');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.message).toBe('Services retrieved successfully');

            const ids = res.body.data.map((s: any) => s.id);
            expect(ids).toContain(activeServiceAlphaId);
            expect(ids).toContain(activeServiceBetaId);
            expect(ids).not.toContain(inactiveServiceId);

            // Verificar que el mapper convirtió las propiedades a camelCase
            const sample = res.body.data.find((s: any) => s.id === activeServiceAlphaId);
            expect(sample).toHaveProperty('categoryId', categoryId);
            expect(sample).toHaveProperty('durationMinutes', 30);
            expect(sample).toHaveProperty('isActive', true);
        });
    });

    describe('GET /api/offeredServices/:id', () => {
        test('Debe responder 200 y devolver el detalle del servicio cuando existe y está activo', async () => {
            const res = await request(app).get(`/api/offeredServices/${activeServiceAlphaId}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({
                id: activeServiceAlphaId,
                categoryId,
                name: 'AAA_Test_Alpha Service',
                durationMinutes: 30,
                isActive: true,
            });
            expect(res.body.message).toBe('Service retrieved successfully');
        });

        test('Debe responder 404 cuando el servicio existe pero está inactivo', async () => {
            const res = await request(app).get(`/api/offeredServices/${inactiveServiceId}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Service not found/i);
        });

        test('Debe responder 404 cuando el ID del servicio NO existe', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app).get(`/api/offeredServices/${fakeUuid}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Service not found/i);
        });

        test('Debe responder 400 cuando el formato del ID no es un UUID válido', async () => {
            const res = await request(app).get('/api/offeredServices/invalid-uuid');

            expect(res.status).toBe(400);
            expect(res.body.error).toContainEqual({
                field: 'id',
                detail: 'Invalid service ID format',
            });
        });
    });
});
