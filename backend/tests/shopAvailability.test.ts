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
    insertReceptionist,
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
    let managerToken: string;
    let otherManagerToken: string;
    let receptionistToken: string;
    let otherShopReceptionistToken: string;

    let clientUser: { id: string; email: string };
    let clientToken: string;
    let otherClientToken: string;

    let shopId: string;
    let otherShopId: string;
    let shiftId: string;
    let barberId: string;
    let serviceId: string;
    let targetDateStr: string;

    /**
     * Cita del cliente en shopId con el barbero barberId, de 09:30 a 10:00. Solo la usan pruebas de lectura:
     * ninguna prueba la modifica, así que su horario es el mismo en todas.
     */
    let appointmentId: string;
    /** Cita del mismo cliente en otherShopId. */
    let otherShopAppointmentId: string;

    const at = (hhmm: string) => new Date(businessWallClockToUtcMs(Date.parse(`${targetDateStr}T${hhmm}:00.000Z`)));

    /** Inserta una cita del cliente con un solo servicio y su snapshot en appointment_services. */
    const insertClientAppointment = async (
        targetShopId: string,
        targetBarberId: string,
        start: string,
        end: string,
        bookedServiceId: string,
        durationMinutes: number
    ): Promise<string> => {
        const id = await insertAppointment(targetShopId, targetBarberId, at(start), at(end), {
            clientId: clientUser.id,
            status: 'scheduled',
        });
        await getPool().query(
            `INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking) VALUES ($1, $2, $3, $4)`,
            [id, bookedServiceId, 200, durationMinutes]
        );
        return id;
    };

    /**
     * Crea un barbero propio en shopId con una cita del cliente. Las pruebas que hacen PUT usan esto para no
     * modificar datos compartidos ni depender del orden en que corren.
     */
    const insertBarberWithAppointment = async (
        start: string,
        end: string,
        bookedServiceId: string,
        durationMinutes: number
    ): Promise<{ barberId: string; appointmentId: string }> => {
        const barber = await insertBarber(shopId, { isAcceptingBookings: true, shiftId });
        const id = await insertClientAppointment(shopId, barber.id, start, end, bookedServiceId, durationMinutes);
        return { barberId: barber.id, appointmentId: id };
    };

    const findBarberSlots = (body: { data: { barberId: string; startTimes: string[] }[] }, id: string) =>
        body.data.find((b) => b.barberId === id);

    beforeAll(async () => {
        await connectDB();

        // Managers y sucursales: shopId y otherShopId son del mismo manager; otherManager no administra ninguna de las dos.
        const manager = await insertManager();
        managerToken = mintToken(manager.id, 'manager', manager.email);
        const otherManager = await insertManager();
        otherManagerToken = mintToken(otherManager.id, 'manager', otherManager.email);

        shopId = await insertShop(manager.id, { name: generateUniqueName('ExclShop') });
        otherShopId = await insertShop(manager.id, { name: generateUniqueName('OtherExclShop') });

        // Turno 09:00-13:00 y barberos
        shiftId = await insertShift(generateUniqueName('ExclShift'), '09:00', '13:00');
        const barber = await insertBarber(shopId, { isAcceptingBookings: true, shiftId });
        barberId = barber.id;
        const otherBarber = await insertBarber(otherShopId, { isAcceptingBookings: true, shiftId });

        // Recepcionistas: uno de shopId y uno de otherShopId
        const receptionist = await insertReceptionist(shopId, shiftId);
        receptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);
        const otherShopReceptionist = await insertReceptionist(otherShopId, shiftId);
        otherShopReceptionistToken = mintToken(otherShopReceptionist.id, 'receptionist', otherShopReceptionist.email);

        // Servicio de 30 min
        serviceId = await insertService({ durationMinutes: 30, isActive: true });

        // Clientes: usuario base + registro en tabla clients
        clientUser = await insertUser('client');
        await getPool().query(`INSERT INTO clients (user_id) VALUES ($1)`, [clientUser.id]);
        clientToken = mintToken(clientUser.id, 'client', clientUser.email);

        const otherClientUser = await insertUser('client');
        await getPool().query(`INSERT INTO clients (user_id) VALUES ($1)`, [otherClientUser.id]);
        otherClientToken = mintToken(otherClientUser.id, 'client', otherClientUser.email);

        // Fecha futura (evitando domingo); a 3 días queda fuera del límite de 8 horas del cliente.
        const targetDate = new Date(`${getBusinessToday()}T00:00:00Z`);
        targetDate.setUTCDate(targetDate.getUTCDate() + 3);
        if (targetDate.getUTCDay() === 0) targetDate.setUTCDate(targetDate.getUTCDate() + 1);
        targetDateStr = targetDate.toISOString().slice(0, 10);

        appointmentId = await insertClientAppointment(shopId, barberId, '09:30', '10:00', serviceId, 30);
        otherShopAppointmentId = await insertClientAppointment(
            otherShopId,
            otherBarber.id,
            '09:30',
            '10:00',
            serviceId,
            30
        );
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    const getWithExclude = (token: string | undefined, excludeAppointmentId: string, targetShopId = shopId) => {
        const req = request(app).get(`/api/shops/${targetShopId}/availability`);
        if (token) req.set('Authorization', `Bearer ${token}`);
        return req.query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId });
    };

    // ── Sin excludeAppointmentId, el endpoint funciona igual (público) ──
    test('sin excludeAppointmentId, el endpoint sigue siendo público y no devuelve los horarios bloqueados', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: serviceId });

        expect(res.status).toBe(200);
        const barberSlots = findBarberSlots(res.body, barberId);
        expect(barberSlots).toBeDefined();

        // 09:15 y 09:30 están bloqueados porque la cita ocupa 09:30-10:00
        expect(barberSlots!.startTimes).not.toContain(at('09:15').toISOString());
        expect(barberSlots!.startTimes).not.toContain(at('09:30').toISOString());
    });

    // ── Con excludeAppointmentId válido, startTimes incluye horarios que solo chocaban con esa cita ──
    test('con excludeAppointmentId válido, startTimes incluye horarios que solo chocaban con esa cita', async () => {
        const res = await getWithExclude(clientToken, appointmentId);

        expect(res.status).toBe(200);
        const barberSlots = findBarberSlots(res.body, barberId);
        expect(barberSlots).toBeDefined();
        expect(barberSlots!.startTimes).toContain(at('09:15').toISOString());
        expect(barberSlots!.startTimes).toContain(at('09:30').toISOString());
    });

    // ── Autenticación (401) ──
    test('con excludeAppointmentId y sin token, responde 401', async () => {
        const res = await getWithExclude(undefined, appointmentId);

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/token/i);
    });

    test('con excludeAppointmentId y un encabezado Authorization mal formado, responde 401', async () => {
        const res = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', 'Token abc')
            .query({ date: targetDateStr, serviceIds: serviceId, excludeAppointmentId: appointmentId });

        expect(res.status).toBe(401);
    });

    test('con excludeAppointmentId y un token inválido, responde 401', async () => {
        const res = await getWithExclude('not-a-valid-jwt', appointmentId);

        expect(res.status).toBe(401);
    });

    // ── Alcance por rol (403), mismas reglas que PUT /appointments/:id ──
    test('un cliente que envía el id de una cita ajena, responde 403', async () => {
        const res = await getWithExclude(otherClientToken, appointmentId);

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Not authorized/i);
    });

    test('un recepcionista de la sucursal de la cita puede excluirla', async () => {
        const res = await getWithExclude(receptionistToken, appointmentId);

        expect(res.status).toBe(200);
        expect(findBarberSlots(res.body, barberId)!.startTimes).toContain(at('09:30').toISOString());
    });

    test('un recepcionista de otra sucursal, responde 403', async () => {
        const res = await getWithExclude(otherShopReceptionistToken, appointmentId);

        expect(res.status).toBe(403);
    });

    test('un manager de la sucursal de la cita puede excluirla y obtener los slots liberados', async () => {
        const res = await getWithExclude(managerToken, appointmentId);

        expect(res.status).toBe(200);
        expect(findBarberSlots(res.body, barberId)!.startTimes).toContain(at('09:30').toISOString());
    });

    test('un manager que no administra la sucursal de la cita, responde 403', async () => {
        const res = await getWithExclude(otherManagerToken, appointmentId);

        expect(res.status).toBe(403);
    });

    // ── Cita de otra sucursal (422) ──
    test('una cita propia de otra sucursal, responde 422', async () => {
        const res = await getWithExclude(clientToken, otherShopAppointmentId);

        expect(res.status).toBe(422);
        expect(res.body.message).toMatch(/does not belong/i);
    });

    test('una cita ajena de otra sucursal responde 403 y no 422, para no revelar su sucursal', async () => {
        const res = await getWithExclude(otherClientToken, otherShopAppointmentId);

        expect(res.status).toBe(403);
    });

    // ── Cita inexistente (404) ──
    test('una cita inexistente, responde 404', async () => {
        const res = await getWithExclude(clientToken, '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b');

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Appointment not found/i);
    });

    // ── Validación de formato (400) ──
    test('excludeAppointmentId con formato inválido, responde 400', async () => {
        const res = await getWithExclude(clientToken, 'not-a-uuid');

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    // ── Los horarios devueltos con excludeAppointmentId son aceptados por PUT /api/appointments/{id} ──
    test('mover la cita 15 min antes: el horario devuelto con excludeAppointmentId es aceptado por el PUT', async () => {
        const own = await insertBarberWithAppointment('09:30', '10:00', serviceId, 30);

        const availRes = await getWithExclude(clientToken, own.appointmentId);
        expect(availRes.status).toBe(200);
        const newStart = at('09:15').toISOString();
        expect(findBarberSlots(availRes.body, own.barberId)!.startTimes).toContain(newStart);

        const putRes = await request(app)
            .put(`/api/appointments/${own.appointmentId}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ scheduledStart: newStart, serviceIds: [serviceId] });

        expect(putRes.status).toBe(200);
        expect(putRes.body.data.scheduledStart).toBe(newStart);
    });

    test('cita de 10:00 a 11:00: excludeAppointmentId permite moverla a las 10:30 con el mismo barbero', async () => {
        const hourServiceId = await insertService({ durationMinutes: 60, isActive: true });
        const own = await insertBarberWithAppointment('10:00', '11:00', hourServiceId, 60);
        const newStart = at('10:30').toISOString();

        // Sin excludeAppointmentId, 10:30-11:30 choca con la propia cita
        const resWithout = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: hourServiceId });
        expect(resWithout.status).toBe(200);
        expect(findBarberSlots(resWithout.body, own.barberId)!.startTimes).not.toContain(newStart);

        // Con excludeAppointmentId, 10:30 sí aparece
        const resWith = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${clientToken}`)
            .query({ date: targetDateStr, serviceIds: hourServiceId, excludeAppointmentId: own.appointmentId });
        expect(resWith.status).toBe(200);
        expect(findBarberSlots(resWith.body, own.barberId)!.startTimes).toContain(newStart);

        // El PUT acepta la reprogramación sin conflicto (409)
        const putRes = await request(app)
            .put(`/api/appointments/${own.appointmentId}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ scheduledStart: newStart, serviceIds: [hourServiceId] });

        expect(putRes.status).toBe(200);
        expect(putRes.body.data.scheduledStart).toBe(newStart);
    });

    test('conservar la hora y agregar un servicio: excludeAppointmentId ofrece la hora original con la duración nueva y el PUT la acepta', async () => {
        // Segundo servicio de 30 min: duración combinada de 60 min
        const secondServiceId = await insertService({ durationMinutes: 30, isActive: true });
        const own = await insertBarberWithAppointment('10:00', '10:30', serviceId, 30);
        const originalStart = at('10:00').toISOString();
        const bothServices = `${serviceId},${secondServiceId}`;

        // Sin excludeAppointmentId, 10:00-11:00 choca con la propia cita
        const resWithout = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .query({ date: targetDateStr, serviceIds: bothServices });
        expect(resWithout.status).toBe(200);
        expect(findBarberSlots(resWithout.body, own.barberId)!.startTimes).not.toContain(originalStart);

        // Con excludeAppointmentId, la hora original sí aparece para los 60 min
        const resWith = await request(app)
            .get(`/api/shops/${shopId}/availability`)
            .set('Authorization', `Bearer ${clientToken}`)
            .query({ date: targetDateStr, serviceIds: bothServices, excludeAppointmentId: own.appointmentId });
        expect(resWith.status).toBe(200);
        expect(findBarberSlots(resWith.body, own.barberId)!.startTimes).toContain(originalStart);

        // El PUT acepta la hora devuelta con los servicios nuevos. Como la hora no cambia, el PUT no consulta la
        // disponibilidad: valida que la nueva duración quepa en el turno y los traslapes con el candado del barbero.
        const putRes = await request(app)
            .put(`/api/appointments/${own.appointmentId}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ scheduledStart: originalStart, serviceIds: [serviceId, secondServiceId] });

        expect(putRes.status).toBe(200);
        expect(putRes.body.data.scheduledStart).toBe(originalStart);
        expect(putRes.body.data.services.length).toBe(2);
    });
});
