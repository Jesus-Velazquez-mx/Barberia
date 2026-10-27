import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getBusinessToday, businessWallClockToUtcMs } from '../src/utils/businessTime.js';
import { signToken } from '../src/services/jwtTokenService.js';
import { canEditAppointment, isWithinClientEditCutoff } from '../src/services/userPermissions.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';
import {
    insertManager,
    insertShop,
    insertUser,
    insertBarber,
    insertService,
    insertAppointment,
    insertReceptionist,
    cleanupFixtures,
    createdAppointmentIds,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

const A = 'a0000000-0000-0000-0000-000000000001';
const B = 'b0000000-0000-0000-0000-000000000002';
const SHOP = 'c0000000-0000-0000-0000-000000000003';
const MS_PER_HOUR = 60 * 60 * 1000;
const MISSING_ID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b'; // UUID v4 válido que no existe

describe('canEditAppointment', () => {
    test('client solo puede editar sus propias citas, nunca las de invitados', () => {
        const appt = { shopId: SHOP, shopManagerId: B };
        expect(canEditAppointment({ id: A, role: 'client' }, { ...appt, clientId: A })).toBe(true);
        expect(canEditAppointment({ id: A, role: 'client' }, { ...appt, clientId: B })).toBe(false);
        expect(canEditAppointment({ id: A, role: 'client' }, { ...appt, clientId: null })).toBe(false);
    });

    test('receptionist solo puede editar citas de su sucursal', () => {
        const appt = { clientId: null, shopId: SHOP, shopManagerId: B };
        expect(canEditAppointment({ id: A, role: 'receptionist' }, appt, SHOP)).toBe(true);
        expect(canEditAppointment({ id: A, role: 'receptionist' }, appt, B)).toBe(false);
        expect(canEditAppointment({ id: A, role: 'receptionist' }, appt)).toBe(false);
    });

    test('manager solo puede editar citas de las sucursales que administra', () => {
        const appt = { clientId: null, shopId: SHOP };
        expect(canEditAppointment({ id: A, role: 'manager' }, { ...appt, shopManagerId: A })).toBe(true);
        expect(canEditAppointment({ id: A, role: 'manager' }, { ...appt, shopManagerId: B })).toBe(false);
    });
});

describe('isWithinClientEditCutoff', () => {
    const now = new Date('2026-10-20T12:00:00.000Z');
    const inHours = (h: number) => new Date(now.getTime() + h * MS_PER_HOUR);

    test('el cliente necesita 8 horas o más de anticipación', () => {
        const client = { id: A, role: 'client' as const };
        expect(isWithinClientEditCutoff(client, inHours(8), now)).toBe(true);
        expect(isWithinClientEditCutoff(client, inHours(7.99), now)).toBe(false);
    });

    test('recepción y gerentes no están sujetos al límite', () => {
        expect(isWithinClientEditCutoff({ id: A, role: 'receptionist' }, inHours(1), now)).toBe(true);
        expect(isWithinClientEditCutoff({ id: A, role: 'manager' }, inHours(1), now)).toBe(true);
    });
});

describe('PUT /api/appointments/:id', () => {
    let shopId: string;
    let otherShopId: string;
    let managerToken: string;
    let otherManagerToken: string;
    let receptionistToken: string;
    let foreignReceptionistToken: string;
    let barber1: string; // reprogramaciones
    let barber2: string; // reasignación destino
    let barber3: string; // sucursal ajena
    let barber4: string; // servicios
    let barber5: string; // carreras
    let barber6: string; // estados / límites
    let serviceId: string;
    let shortServiceId: string;
    let dayA: string;
    let dayB: string;
    const clients: { id: string; token: string }[] = [];

    // Hora de pared de la sucursal (dígitos literales) -> instante UTC real, igual que hace el servicio.
    const at = (day: string, time: string) =>
        new Date(businessWallClockToUtcMs(Date.parse(`${day}T${time}:00.000Z`))).toISOString();

    // Primer día que no es domingo (las sucursales cierran domingo) a partir de hoy + `offset` días.
    const openDay = (offset: number) => {
        const date = new Date(`${getBusinessToday()}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + offset);
        if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
        return date.toISOString().slice(0, 10);
    };

    const book = (token: string, barberId: string, scheduledStart: string, body: Record<string, unknown> = {}) =>
        request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${token}`)
            .send({ barberId, serviceIds: [serviceId], scheduledStart, ...body });

    const edit = (token: string, id: string, body: Record<string, unknown>) =>
        request(app).put(`/api/appointments/${id}`).set('Authorization', `Bearer ${token}`).send(body);

    // Cita del cliente 0 vía la API; devuelve su id.
    const bookOwn = async (barberId: string, scheduledStart: string, client = clients[0]) => {
        const res = await book(client.token, barberId, scheduledStart);
        expect(res.status).toBe(201);
        return res.body.data.id as string;
    };

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        managerToken = mintToken(manager.id, 'manager', manager.email);
        shopId = await insertShop(manager.id);

        const otherManager = await insertManager();
        otherManagerToken = mintToken(otherManager.id, 'manager', otherManager.email);
        otherShopId = await insertShop(otherManager.id);

        const shiftId = (await getPool().query(`SELECT id FROM shifts LIMIT 1`)).rows[0].id;
        const receptionist = await insertReceptionist(shopId, shiftId);
        receptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);
        const foreignReceptionist = await insertReceptionist(otherShopId, shiftId);
        foreignReceptionistToken = mintToken(foreignReceptionist.id, 'receptionist', foreignReceptionist.email);

        for (let i = 0; i < 2; i++) {
            const client = await insertUser('client');
            await getPool().query(`INSERT INTO clients (user_id) VALUES ($1)`, [client.id]);
            clients.push({ id: client.id, token: mintToken(client.id, 'client', client.email) });
        }

        barber1 = (await insertBarber(shopId)).id;
        barber2 = (await insertBarber(shopId)).id;
        barber3 = (await insertBarber(otherShopId)).id;
        barber4 = (await insertBarber(shopId)).id;
        barber5 = (await insertBarber(shopId)).id;
        barber6 = (await insertBarber(shopId)).id;
        serviceId = await insertService({ durationMinutes: 30 });
        shortServiceId = await insertService({ durationMinutes: 15, price: 100 });

        dayA = openDay(2);
        dayB = openDay(4);
        // 12:00 - 15:00 cae dentro de ambos turnos (mañana 8-16, tarde 12-20)
    });

    afterEach(async () => {
        const result = await getPool().query(`SELECT id FROM appointments WHERE shop_id = ANY($1::uuid[])`, [
            [shopId, otherShopId],
        ]);
        createdAppointmentIds.push(...result.rows.map((r: { id: string }) => r.id));
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    test('401 sin token', async () => {
        const res = await request(app).put(`/api/appointments/${A}`).send({ notes: 'x' });
        expect(res.status).toBe(401);
    });

    test('404 si la cita no existe', async () => {
        const res = await edit(managerToken, MISSING_ID, { notes: 'x' });
        expect(res.status).toBe(404);
    });

    test('400 con id inválido, cuerpo vacío o campos no editables', async () => {
        const id = MISSING_ID;

        expect((await edit(managerToken, 'no-es-uuid', { notes: 'x' })).status).toBe(400);
        expect((await edit(managerToken, id, {})).status).toBe(400);
        expect((await edit(managerToken, id, { clientId: clients[1].id })).status).toBe(400);
        expect((await edit(managerToken, id, { guestClientName: 'Otro' })).status).toBe(400);
        expect((await edit(managerToken, id, { serviceIds: [] })).status).toBe(400);
    });

    test('client reprograma su cita a otro día: pasa a rescheduled y conserva originalScheduledStart', async () => {
        const id = await bookOwn(barber1, at(dayA, '12:00'));

        const res = await edit(clients[0].token, id, { scheduledStart: at(dayB, '12:00') });

        expect(res.status).toBe(200);
        expect(res.body.data).not.toHaveProperty('client');
        expect(res.body.data.status).toBe('rescheduled');
        expect(new Date(res.body.data.scheduledStart).toISOString()).toBe(at(dayB, '12:00'));
        expect(new Date(res.body.data.scheduledEnd).toISOString()).toBe(at(dayB, '12:30'));
        expect(new Date(res.body.data.originalScheduledStart).toISOString()).toBe(at(dayA, '12:00'));
    });

    test('una cita rescheduled sigue ocupando el horario del barbero', async () => {
        // barber1 tiene la cita reprogramada del test anterior en dayB 12:00
        const res = await book(clients[1].token, barber1, at(dayB, '12:00'));
        expect(res.status).toBe(409);
    });

    test('una cita rescheduled puede volver a editarse', async () => {
        const id = await bookOwn(barber1, at(dayA, '13:00'));
        expect((await edit(clients[0].token, id, { scheduledStart: at(dayB, '13:00') })).status).toBe(200);

        const res = await edit(clients[0].token, id, { scheduledStart: at(dayA, '14:00') });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('rescheduled');
    });

    test('mover la cita el mismo día a un horario que se traslapa con ella misma no choca', async () => {
        const id = await bookOwn(barber2, at(dayA, '12:00'));

        const res = await edit(clients[0].token, id, { scheduledStart: at(dayA, '12:15') });

        expect(res.status).toBe(200);
        expect(new Date(res.body.data.scheduledStart).toISOString()).toBe(at(dayA, '12:15'));
    });

    test('409 si el nuevo horario ya está ocupado por otra cita', async () => {
        await bookOwn(barber2, at(dayB, '14:00'), clients[1]);
        const id = await bookOwn(barber2, at(dayA, '14:00'));

        const res = await edit(clients[0].token, id, { scheduledStart: at(dayB, '14:00') });
        expect(res.status).toBe(409);
    });

    test('409 si el horario no es uno de los ofrecidos', async () => {
        const id = await bookOwn(barber2, at(dayA, '13:30'));
        const res = await edit(clients[0].token, id, { scheduledStart: at(dayA, '13:35') });
        expect(res.status).toBe(409);
    });

    test('reasigna a otro barbero de la misma sucursal; el de otra sucursal se rechaza', async () => {
        const id = await bookOwn(barber1, at(dayA, '14:30'));

        const foreign = await edit(clients[0].token, id, { barberId: barber3 });
        expect(foreign.status).toBe(422);

        const res = await edit(clients[0].token, id, { barberId: barber5 });
        expect(res.status).toBe(200);
        expect(res.body.data.barberId).toBe(barber5);
        expect(res.body.data.status).toBe('rescheduled');
    });

    test('un client no puede editar la cita de otro cliente ni la de un invitado', async () => {
        const othersId = await bookOwn(barber6, at(dayA, '12:00'), clients[1]);
        expect((await edit(clients[0].token, othersId, { notes: 'x' })).status).toBe(403);

        const guest = await book(managerToken, barber6, at(dayA, '13:00'), { guestClientName: 'Invitado' });
        expect(guest.status).toBe(201);
        expect((await edit(clients[0].token, guest.body.data.id, { notes: 'x' })).status).toBe(403);
    });

    test('recepción y gerente de otra sucursal no pueden editar la cita', async () => {
        const id = await bookOwn(barber6, at(dayA, '14:00'));

        expect((await edit(foreignReceptionistToken, id, { notes: 'x' })).status).toBe(403);
        expect((await edit(otherManagerToken, id, { notes: 'x' })).status).toBe(403);
    });

    test('recepción y gerente de la sucursal editan citas de clientes e invitados', async () => {
        const id = await bookOwn(barber6, at(dayB, '12:00'));

        const byReceptionist = await edit(receptionistToken, id, { scheduledStart: at(dayB, '12:30') });
        expect(byReceptionist.status).toBe(200);
        expect(byReceptionist.body.data.client.id).toBe(clients[0].id);

        const guest = await book(receptionistToken, barber6, at(dayB, '13:00'), { guestClientName: 'Invitado' });
        const byManager = await edit(managerToken, guest.body.data.id, { scheduledStart: at(dayB, '13:30') });
        expect(byManager.status).toBe(200);
        expect(byManager.body.data.guestClientName).toBe('Invitado');
        expect(byManager.body.data.isRegisteredClient).toBe(false);
    });

    test('con menos de 8 horas el client no puede editar pero el personal sí', async () => {
        const start = new Date(Date.now() + 2 * MS_PER_HOUR);
        const end = new Date(start.getTime() + 30 * 60_000);
        const id = await insertAppointment(shopId, barber6, start, end, { clientId: clients[0].id });

        expect((await edit(clients[0].token, id, { notes: 'x' })).status).toBe(403);

        const byReceptionist = await edit(receptionistToken, id, { notes: 'desde recepción' });
        expect(byReceptionist.status).toBe(200);
        expect((await edit(managerToken, id, { notes: 'desde gerencia' })).status).toBe(200);
    });

    test('409 si la cita ya no está scheduled / rescheduled o ya empezó', async () => {
        const future = (hours: number) => new Date(Date.now() + hours * MS_PER_HOUR);
        const mk = (status: 'checked_in' | 'completed' | 'cancelled' | 'no_show', start = future(20)) =>
            insertAppointment(shopId, barber6, start, new Date(start.getTime() + 30 * 60_000), {
                clientId: clients[0].id,
                status,
            });

        for (const status of ['checked_in', 'completed', 'cancelled', 'no_show'] as const) {
            const res = await edit(managerToken, await mk(status), { notes: 'x' });
            expect(res.status).toBe(409);
        }

        const started = await insertAppointment(shopId, barber6, future(-1), future(-0.5), {
            clientId: clients[0].id,
        });
        expect((await edit(managerToken, started, { notes: 'x' })).status).toBe(409);
    });

    test('editar solo las notas conserva el estado; null las borra', async () => {
        const id = await bookOwn(barber4, at(dayA, '12:00'));

        const set = await edit(clients[0].token, id, { notes: '  sin barba  ' });
        expect(set.status).toBe(200);
        expect(set.body.data.notes).toBe('sin barba');
        expect(set.body.data.status).toBe('scheduled');
        expect(new Date(set.body.data.scheduledStart).toISOString()).toBe(at(dayA, '12:00'));

        const cleared = await edit(clients[0].token, id, { notes: null });
        expect(cleared.status).toBe(200);
        expect(cleared.body.data.notes).toBeNull();
    });

    test('cambiar servicios recalcula el fin, conserva el snapshot de los que se quedan y no cambia el estado', async () => {
        const id = await bookOwn(barber4, at(dayA, '13:00'));
        // El precio del catálogo cambia después de agendar: el servicio que se conserva mantiene el original.
        await getPool().query(`UPDATE services SET price = 999 WHERE id = $1`, [serviceId]);

        const res = await edit(clients[0].token, id, { serviceIds: [serviceId, shortServiceId] });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('scheduled');
        expect(new Date(res.body.data.scheduledEnd).toISOString()).toBe(at(dayA, '13:45'));
        expect(res.body.data.services).toHaveLength(2);
        expect(res.body.data.services).toEqual(
            expect.arrayContaining([
                { serviceId, priceAtBooking: 200, durationMinutesAtBooking: 30 },
                { serviceId: shortServiceId, priceAtBooking: 100, durationMinutesAtBooking: 15 },
            ])
        );

        const removed = await edit(clients[0].token, id, { serviceIds: [shortServiceId] });
        expect(removed.status).toBe(200);
        expect(removed.body.data.services).toEqual([
            { serviceId: shortServiceId, priceAtBooking: 100, durationMinutesAtBooking: 15 },
        ]);
        expect(new Date(removed.body.data.scheduledEnd).toISOString()).toBe(at(dayA, '13:15'));
    });

    test('409 si servicios más largos chocan con la siguiente cita del mismo barbero', async () => {
        const id = await bookOwn(barber4, at(dayB, '12:00'));
        await bookOwn(barber4, at(dayB, '12:30'), clients[1]);

        const res = await edit(clients[0].token, id, { serviceIds: [serviceId, shortServiceId] });
        expect(res.status).toBe(409);
    });

    test('422 si el nuevo horario queda a más de 30 días de la fecha en que se agendó', async () => {
        const id = await bookOwn(barber4, at(dayA, '14:00'));
        await getPool().query(`UPDATE appointments SET created_at = now() - interval '40 days' WHERE id = $1`, [id]);

        const res = await edit(clients[0].token, id, { scheduledStart: at(dayB, '14:00') });
        expect(res.status).toBe(422);
    });

    test('una edición y una reserva simultáneas por el mismo horario: solo una gana', async () => {
        const id = await bookOwn(barber5, at(dayA, '12:00'));

        const responses = await Promise.all([
            edit(clients[0].token, id, { scheduledStart: at(dayB, '14:00') }),
            book(clients[1].token, barber5, at(dayB, '14:00')),
        ]);

        const statuses = responses.map((r) => r.status).sort();
        expect(statuses[1]).toBe(409);
        expect([200, 201]).toContain(statuses[0]);
        const count = await getPool().query(
            `SELECT count(*)::int AS n FROM appointments
             WHERE barber_id = $1 AND scheduled_start = $2 AND status IN ('scheduled', 'rescheduled')`,
            [barber5, at(dayB, '14:00')]
        );
        expect(count.rows[0].n).toBe(1);
    });
});
