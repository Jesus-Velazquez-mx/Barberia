import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getBusinessToday, businessWallClockToUtcMs } from '../src/utils/businessTime.js';
import {
    insertManager,
    insertShop,
    insertBarber,
    insertShift,
    insertService,
    insertAppointment,
    cleanupFixtures,
} from './helpers/availabilityFixtures.js';
import { generateUniqueName } from './helpers/uniqueValues.js';

const { connectDB, closeDB } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

describe('GET /api/shops/:id/availability', () => {
    let shopId: string;
    let barberId: string;
    let serviceId: string;
    let targetDateStr: string;

    // Hora de pared del negocio (dígitos literales) -> instante UTC real, igual que hace el servicio.
    const at = (hhmm: string) => new Date(businessWallClockToUtcMs(Date.parse(`${targetDateStr}T${hhmm}:00.000Z`)));

    beforeAll(async () => {
        await connectDB();

        // 1. Crear manager y sucursal
        const manager = await insertManager();
        shopId = await insertShop(manager.id, { name: 'Availability Integration Shop', isActive: true });

        // 2. Crear un turno acotado a 09:00-11:00 UTC para que la ventana disponible sea exacta y predecible
        const shiftId = await insertShift(generateUniqueName('Shift'), '09:00', '11:00');

        // 3. Crear barbero con ese turno
        const barber = await insertBarber(shopId, { isAcceptingBookings: true, shiftId });
        barberId = barber.id;

        // 4. Crear servicio de 30 minutos
        serviceId = await insertService({ durationMinutes: 30, isActive: true });

        // 5. Seleccionar una fecha futura fija para la prueba (2 días en el futuro, evitando domingo porque cierra)
        const targetDate = new Date(`${getBusinessToday()}T00:00:00Z`);
        targetDate.setUTCDate(targetDate.getUTCDate() + 2);
        if (targetDate.getUTCDay() === 0) targetDate.setUTCDate(targetDate.getUTCDate() + 1);
        targetDateStr = targetDate.toISOString().slice(0, 10);

        // 6. Insertar una cita entre 09:30 y 10:00, hora de la sucursal
        await insertAppointment(shopId, barberId, at('09:30'), at('10:00'), { status: 'scheduled' });
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    test('debe devolver 200 y el payload de slots excluyendo correctamente el horario de la cita insertada', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: serviceId });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/Available slots retrieved successfully/i);
        expect(Array.isArray(res.body.data)).toBe(true);

        const barberAvailability = res.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(barberAvailability).toBeDefined();

        const startTimes: string[] = barberAvailability.startTimes;

        // Con ventana de 09:00 a 11:00 (duración 30 min) y cita de 09:30 a 10:00:
        // Hueco 1: 09:00 a 09:30 -> inicio a las 09:00
        // Hueco 2: 10:00 a 11:00 -> inicios a las 10:00, 10:15, 10:30
        const expectedSlot9 = at('09:00').toISOString();
        const expectedSlot10 = at('10:00').toISOString();
        const expectedSlot1015 = at('10:15').toISOString();
        const expectedSlot1030 = at('10:30').toISOString();

        // Horarios bloqueados por la cita:
        const blockedSlot915 = at('09:15').toISOString();
        const blockedSlot930 = at('09:30').toISOString();
        const blockedSlot945 = at('09:45').toISOString();

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
            .query({ date: 'invalid-date', serviceIds: serviceId });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    test('debe responder 400 cuando falta serviceIds', async () => {
        const res = await request(app).get(`/api/shops/${shopId}/availability`).query({ date: targetDateStr });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    test('debe responder 400 cuando serviceIds no es un UUID válido', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: 'not-a-valid-uuid' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    test('debe responder 400 cuando la fecha es anterior a hoy', async () => {
        // "Ayer" respecto al día de hoy en la zona horaria del negocio (no la del servidor ni UTC).
        const yesterday = new Date(`${getBusinessToday()}T00:00:00Z`);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const pastDateStr = yesterday.toISOString().slice(0, 10);

        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: pastDateStr, serviceIds: serviceId });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    test('debe responder 404 para una sucursal desconocida', async () => {
        const nonExistentShopId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
            .get(`/api/shops/${nonExistentShopId}/availability`)
            .query({ date: targetDateStr, serviceIds: serviceId });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Shop not found/i);
    });

    test('debe responder 404 para un servicio desconocido', async () => {
        const nonExistentServiceId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: nonExistentServiceId });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Service not found/i);
    });

    test('debe responder 404 para un servicio inactivo', async () => {
        const inactiveServiceId = await insertService({ durationMinutes: 30, isActive: false });
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: inactiveServiceId });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Service not found or is inactive/i);
    });

    test('varios servicios: los horarios usan la suma de sus duraciones', async () => {
        // 30 + 30 min: en 09:00-11:00 con la cita 09:30-10:00, solo cabe 10:00-11:00
        const secondServiceId = await insertService({ durationMinutes: 30, isActive: true });
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: `${serviceId},${secondServiceId}` });

        expect(res.status).toBe(200);
        const barberSlots = res.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(barberSlots.startTimes).toEqual([at('10:00').toISOString()]);
    });

    test('debe responder 400 con serviceIds repetidos', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: `${serviceId},${serviceId}` });

        expect(res.status).toBe(400);
    });
});
