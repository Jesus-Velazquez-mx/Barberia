import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getBusinessToday, businessWallClockToUtcMs } from '../src/utils/businessTime.js';
import {
    insertManager,
    insertUser,
    insertShop,
    insertBarber,
    insertShift,
    insertService,
    insertAppointment,
    cleanupFixtures,
} from './helpers/availabilityFixtures.js';
import { generateUniqueName } from './helpers/uniqueValues.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

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

// ─────────────────────────────────────────────────────────────────────────────────
// Pruebas de excludeAppointmentId en GET /api/shops/:id/availability
// ─────────────────────────────────────────────────────────────────────────────────
describe('GET /api/shops/:id/availability — excludeAppointmentId', () => {
    let managerId: string;
    let managerEmail: string;
    let managerToken: string;

    let clientUser: { id: string; email: string };
    let clientToken: string;

    let otherClientUser: { id: string; email: string };
    let otherClientToken: string;

    let shopId: string;
    let otherShopId: string;
    let barberId: string;
    let serviceId: string;
    let targetDateStr: string;

    /** ID de la cita del cliente, en shopId, barbero barberId, de 09:30 a 10:00. */
    let appointmentId: string;
    /** ID de una cita en otherShopId. */
    let otherShopAppointmentId: string;

    const at = (hhmm: string) => new Date(businessWallClockToUtcMs(Date.parse(`${targetDateStr}T${hhmm}:00.000Z`)));

    beforeAll(async () => {
        await connectDB();

        // Manager y sucursales
        const manager = await insertManager();
        managerId = manager.id;
        managerEmail = manager.email;
        managerToken = mintToken(managerId, 'manager', managerEmail);

        shopId = await insertShop(managerId, { name: generateUniqueName('ExclShop') });
        otherShopId = await insertShop(managerId, { name: generateUniqueName('OtherExclShop') });

        // Turno 09:00-13:00 y barberos
        const shiftId = await insertShift(generateUniqueName('ExclShift'), '09:00', '13:00');
        const barber = await insertBarber(shopId, { isAcceptingBookings: true, shiftId });
        barberId = barber.id;
        const otherBarber = await insertBarber(otherShopId, { isAcceptingBookings: true, shiftId });

        // Servicio de 30 min
        serviceId = await insertService({ durationMinutes: 30, isActive: true });

        // Clientes: usuario base + registro en tabla clients
        clientUser = await insertUser('client');
        await getPool().query(`INSERT INTO clients (user_id) VALUES ($1)`, [clientUser.id]);
        clientToken = mintToken(clientUser.id, 'client', clientUser.email);

        otherClientUser = await insertUser('client');
        await getPool().query(`INSERT INTO clients (user_id) VALUES ($1)`, [otherClientUser.id]);
        otherClientToken = mintToken(otherClientUser.id, 'client', otherClientUser.email);

        // Fecha futura (evitando domingo)
        const targetDate = new Date(`${getBusinessToday()}T00:00:00Z`);
        targetDate.setUTCDate(targetDate.getUTCDate() + 3);
        if (targetDate.getUTCDay() === 0) targetDate.setUTCDate(targetDate.getUTCDate() + 1);
        targetDateStr = targetDate.toISOString().slice(0, 10);

        // Cita del cliente en shopId, barbero barberId, 09:30-10:00 con su servicio correspondiente
        appointmentId = await insertAppointment(shopId, barberId, at('09:30'), at('10:00'), {
            clientId: clientUser.id,
            status: 'scheduled',
        });
        await getPool().query(
            `INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking) VALUES ($1, $2, $3, $4)`,
            [appointmentId, serviceId, 200, 30]
        );

        // Cita en otherShopId con su servicio correspondiente
        otherShopAppointmentId = await insertAppointment(otherShopId, otherBarber.id, at('09:30'), at('10:00'), {
            clientId: clientUser.id,
            status: 'scheduled',
        });
        await getPool().query(
            `INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking) VALUES ($1, $2, $3, $4)`,
            [otherShopAppointmentId, serviceId, 200, 30]
        );
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    // ── Criterio 1: sin excludeAppointmentId, el endpoint funciona igual (público) ──
    test('sin excludeAppointmentId, el endpoint sigue siendo público y no devuelve los horarios bloqueados', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: serviceId });

        expect(res.status).toBe(200);
        const barberSlots = res.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(barberSlots).toBeDefined();

        // 09:30 está bloqueado porque la cita ocupa ese horario
        expect(barberSlots.startTimes).not.toContain(at('09:30').toISOString());
    });

    // ── Criterio 2: con excludeAppointmentId válido, startTimes incluye horarios que solo chocaban con esa cita ──
    test('con excludeAppointmentId válido, startTimes incluye horarios que solo chocaban con esa cita', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${clientToken}`)
            .query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId: appointmentId });

        expect(res.status).toBe(200);
        const barberSlots = res.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(barberSlots).toBeDefined();

        // Ahora 09:15 y 09:30 están disponibles porque la cita de 09:30-10:00 se excluyó
        expect(barberSlots.startTimes).toContain(at('09:15').toISOString());
        expect(barberSlots.startTimes).toContain(at('09:30').toISOString());
    });

    // ── Criterio 3: con excludeAppointmentId y sin token → 401 ──
    test('con excludeAppointmentId y sin token, responde 401', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId: appointmentId });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/token/i);
    });

    // ── Criterio 4: un cliente que manda el id de una cita ajena → 403 ──
    test('un cliente que envía el id de una cita ajena, responde 403', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${otherClientToken}`)
            .query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId: appointmentId });

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Not authorized/i);
    });

    // ── Criterio 5: una cita de otra sucursal → 422 (INVALID_INPUT) ──
    test('una cita de otra sucursal, responde 422', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${clientToken}`)
            .query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId: otherShopAppointmentId });

        expect(res.status).toBe(422);
        expect(res.body.message).toMatch(/does not belong/i);
    });

    // ── Criterio 6: una cita inexistente → 404 ──
    test('una cita inexistente, responde 404', async () => {
        const fakeAppointmentId = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${clientToken}`)
            .query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId: fakeAppointmentId });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Appointment not found/i);
    });

    // ── Criterio 7: un manager puede excluir la cita (tiene permiso de edición) ──
    test('un manager puede excluir la cita y obtener los slots liberados', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId: appointmentId });

        expect(res.status).toBe(200);
        const barberSlots = res.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(barberSlots.startTimes).toContain(at('09:30').toISOString());
    });

    // ── Criterio adicional: excludeAppointmentId con formato UUID inválido → 400 ──
    test('excludeAppointmentId con formato inválido, responde 400', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${clientToken}`)
            .query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId: 'not-a-uuid' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    // ── Criterio 7 (final): todo horario con excludeAppointmentId es aceptado por PUT /api/appointments/{id} ──
    test('los horarios devueltos con excludeAppointmentId son aceptados por PUT /api/appointments/{id}', async () => {
        // 1. Consultar disponibilidad excluyendo la propia cita
        const availRes = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${clientToken}`)
            .query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId: appointmentId });

        expect(availRes.status).toBe(200);
        const barberSlots = availRes.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(barberSlots).toBeDefined();
        expect(barberSlots.startTimes.length).toBeGreaterThan(0);

        // 2. Elegir un horario que antes estaba bloqueado por la propia cita (09:15, 15 min antes del inicio original)
        const newStart = at('09:15').toISOString();
        expect(barberSlots.startTimes).toContain(newStart);

        // 3. Reagendar la cita usando PUT /api/appointments/{id} a las 09:15
        const putRes = await request(app)
            .put(`/api/appointments/${appointmentId}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ scheduledStart: newStart, serviceIds: [serviceId] });

        // El PUT acepta el horario y la cita se actualiza correctamente
        expect(putRes.status).toBe(200);
        expect(putRes.body.data.scheduledStart).toBe(newStart);
    });

    test('conservar la hora y agregar un servicio: con excludeAppointmentId se ofrece la hora original con la duración nueva', async () => {
        // Crear un segundo servicio de 30 min (duración total combinada: 30 + 30 = 60 min)
        const secondServiceId = await insertService({ durationMinutes: 30, isActive: true });

        // 1. Sin excludeAppointmentId: consultar disponibilidad para ambos servicios.
        // La cita original bloquea el barbero, por lo que 09:15, 09:30 no aparecen
        const resWithoutExcl = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: `${serviceId},${secondServiceId}` });

        expect(resWithoutExcl.status).toBe(200);
        const slotsWithout = resWithoutExcl.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(slotsWithout.startTimes).not.toContain(at('09:15').toISOString());

        // 2. Con excludeAppointmentId: 09:15 sí aparece libre para los 60 min
        const resWithExcl = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${clientToken}`)
            .query({
                date: targetDateStr,
                serviceIds: `${serviceId},${secondServiceId}`,
                excludeAppointmentId: appointmentId,
            });

        expect(resWithExcl.status).toBe(200);
        const slotsWith = resWithExcl.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(slotsWith.startTimes).toContain(at('09:15').toISOString());

        // 3. PUT acepta agregar el servicio a la cita
        const putRes = await request(app)
            .put(`/api/appointments/${appointmentId}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ serviceIds: [serviceId, secondServiceId] });

        expect(putRes.status).toBe(200);
        expect(putRes.body.data.services.length).toBe(2);
    });

    test('cita de 10:00 a 11:00: excludeAppointmentId permite moverla a las 10:30 con el mismo barbero sin chocar consigo misma', async () => {
        // 1. Crear un servicio de 60 minutos
        const hourServiceId = await insertService({ durationMinutes: 60, isActive: true });

        // 2. Crear una cita de 10:00 a 11:00 para el cliente con el barbero (turno cubre 09:00 a 13:00)
        const appt10to11Id = await insertAppointment(shopId, barberId, at('10:00'), at('11:00'), {
            clientId: clientUser.id,
            status: 'scheduled',
        });
        await getPool().query(
            `INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking) VALUES ($1, $2, $3, $4)`,
            [appt10to11Id, hourServiceId, 250, 60]
        );

        // 3. Consulta de disponibilidad SIN excludeAppointmentId:
        // Como la cita actual va de 10:00 a 11:00, las 10:30 choca con ella y NO debe estar disponible
        const resWithout = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: hourServiceId });

        expect(resWithout.status).toBe(200);
        const slotsWithout = resWithout.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(slotsWithout.startTimes).not.toContain(at('10:30').toISOString());

        // 4. Consulta de disponibilidad CON excludeAppointmentId:
        // Las 10:30 (10:30 a 11:30) SÍ debe aparecer libre porque la propia cita se excluye del cálculo
        const resWith = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${clientToken}`)
            .query({
                date: targetDateStr,
                serviceIds: hourServiceId,
                excludeAppointmentId: appt10to11Id,
            });

        expect(resWith.status).toBe(200);
        const slotsWith = resWith.body.data.find((b: { barberId: string }) => b.barberId === barberId);
        expect(slotsWith.startTimes).toContain(at('10:30').toISOString());

        // 5. Mover la cita a las 10:30 mediante PUT /api/appointments/:id
        const newStart1030 = at('10:30').toISOString();
        const putRes = await request(app)
            .put(`/api/appointments/${appt10to11Id}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ scheduledStart: newStart1030, serviceIds: [hourServiceId] });

        // PUT debe aceptar la reprogramación a las 10:30 sin responder conflicto (409)
        expect(putRes.status).toBe(200);
        expect(putRes.body.data.scheduledStart).toBe(newStart1030);
    });
});
