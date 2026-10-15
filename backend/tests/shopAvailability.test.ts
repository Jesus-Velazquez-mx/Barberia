import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getBusinessToday } from '../src/utils/businessTime.js';
import {
    insertManager,
    insertShop,
    insertBarber,
    insertAvailabilitySlot,
    insertService,
    insertAppointment,
    cleanupFixtures,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

describe('GET /api/shops/:id/availability', () => {
    let shopId: string;
    let barberId: string;
    let serviceId: string;
    let targetDateStr: string;

    beforeAll(async () => {
        await connectDB();

        // 1. Crear manager y sucursal
        const manager = await insertManager();
        shopId = await insertShop(manager.id, { name: 'Availability Integration Shop', isActive: true });

        // 2. Crear barbero con shift asignado
        const barber = await insertBarber(shopId, { isAcceptingBookings: true });
        barberId = barber.id;

        // 3. Crear servicio de 30 minutos
        serviceId = await insertService({ durationMinutes: 30, isActive: true });

        // 4. Seleccionar una fecha futura fija para la prueba (mañana o 2 días en el futuro)
        const targetDate = new Date(`${getBusinessToday()}T00:00:00Z`);
        targetDate.setUTCDate(targetDate.getUTCDate() + 2);
        targetDateStr = targetDate.toISOString().slice(0, 10);
        const dayOfWeek = targetDate.getUTCDay();

        // 5. Insertar plantilla de disponibilidad de 09:00 a 11:00 UTC para ese día de la semana
        await insertAvailabilitySlot(barberId, shopId, dayOfWeek, '09:00', '11:00', true);

        // 6. Insertar una cita entre 09:30 y 10:00 UTC
        const apptStart = new Date(`${targetDateStr}T09:30:00.000Z`);
        const apptEnd = new Date(`${targetDateStr}T10:00:00.000Z`);
        await insertAppointment(shopId, barberId, apptStart, apptEnd, { status: 'scheduled' });
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    test('debe devolver 200 y el payload de slots excluyendo correctamente el horario de la cita insertada', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceId });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/Available slots retrieved successfully/i);
        expect(Array.isArray(res.body.data)).toBe(true);

        const barberAvailability = res.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(barberAvailability).toBeDefined();

        const startTimes: string[] = barberAvailability.startTimes;

        // Con ventana de 09:00 a 11:00 (duración 30 min) y cita de 09:30 a 10:00:
        // Hueco 1: 09:00 a 09:30 -> inicio a las 09:00
        // Hueco 2: 10:00 a 11:00 -> inicios a las 10:00, 10:15, 10:30
        const expectedSlot9 = new Date(`${targetDateStr}T09:00:00.000Z`).toISOString();
        const expectedSlot10 = new Date(`${targetDateStr}T10:00:00.000Z`).toISOString();
        const expectedSlot1015 = new Date(`${targetDateStr}T10:15:00.000Z`).toISOString();
        const expectedSlot1030 = new Date(`${targetDateStr}T10:30:00.000Z`).toISOString();

        // Horarios bloqueados por la cita:
        const blockedSlot915 = new Date(`${targetDateStr}T09:15:00.000Z`).toISOString();
        const blockedSlot930 = new Date(`${targetDateStr}T09:30:00.000Z`).toISOString();
        const blockedSlot945 = new Date(`${targetDateStr}T09:45:00.000Z`).toISOString();

        expect(startTimes).toContain(expectedSlot9);
        expect(startTimes).toContain(expectedSlot10);
        expect(startTimes).toContain(expectedSlot1015);
        expect(startTimes).toContain(expectedSlot1030);

        expect(startTimes).not.toContain(blockedSlot915);
        expect(startTimes).not.toContain(blockedSlot930);
        expect(startTimes).not.toContain(blockedSlot945);
    });

    test('debe responder 400 cuando la fecha está mal formada', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: 'invalid-date', serviceId });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    test('debe responder 400 cuando falta serviceId', async () => {
        const res = await request(app).get(`/api/shops/${shopId}/availability`).query({ date: targetDateStr });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    test('debe responder 400 cuando el serviceId no es un UUID válido', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceId: 'not-a-valid-uuid' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    test('debe responder 400 cuando la fecha es anterior a hoy', async () => {
        // "Ayer" respecto al día de hoy en la zona horaria del negocio (no la del servidor ni UTC).
        const yesterday = new Date(`${getBusinessToday()}T00:00:00Z`);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const pastDateStr = yesterday.toISOString().slice(0, 10);

        const res = await request(app).get(`/api/shops/${shopId}/availability`).query({ date: pastDateStr, serviceId });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    test('debe responder 404 para una sucursal desconocida', async () => {
        const nonExistentShopId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
            .get(`/api/shops/${nonExistentShopId}/availability`)
            .query({ date: targetDateStr, serviceId });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Shop not found/i);
    });

    test('debe responder 404 para un servicio desconocido', async () => {
        const nonExistentServiceId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceId: nonExistentServiceId });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Service not found/i);
    });

    test('debe responder 404 para un servicio inactivo', async () => {
        const inactiveServiceId = await insertService({ durationMinutes: 30, isActive: false });
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceId: inactiveServiceId });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Service not found or is inactive/i);
    });
});
