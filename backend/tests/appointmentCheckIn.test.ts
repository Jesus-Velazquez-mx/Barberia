import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { signToken } from '../src/services/jwtTokenService.js';
import { canCheckInAppointment } from '../src/services/userPermissions.js';
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
    getSeededShiftId,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

const A = 'a0000000-0000-0000-0000-000000000001';
const B = 'b0000000-0000-0000-0000-000000000002';
const SHOP = 'c0000000-0000-0000-0000-000000000003';
const MISSING_ID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b'; // UUID v4 válido que no existe
const MS_PER_MINUTE = 60_000;

describe('canCheckInAppointment', () => {
    const appt = { clientId: A, shopId: SHOP, shopManagerId: B };

    test('client nunca puede hacer check-in', () => {
        expect(canCheckInAppointment({ id: A, role: 'client' }, appt)).toBe(false);
        expect(canCheckInAppointment({ id: B, role: 'client' }, appt)).toBe(false);
    });

    test('receptionist solo puede hacer check-in en su sucursal', () => {
        expect(canCheckInAppointment({ id: A, role: 'receptionist' }, appt, SHOP)).toBe(true);
        expect(canCheckInAppointment({ id: A, role: 'receptionist' }, appt, B)).toBe(false);
        expect(canCheckInAppointment({ id: A, role: 'receptionist' }, appt)).toBe(false);
    });

    test('manager solo puede hacer check-in en las sucursales que administra', () => {
        expect(canCheckInAppointment({ id: B, role: 'manager' }, appt)).toBe(true);
        expect(canCheckInAppointment({ id: A, role: 'manager' }, appt)).toBe(false);
    });
});

describe('PUT /api/appointments/:id/check-in', () => {
    let shopId: string;
    let otherShopId: string;
    let managerToken: string;
    let otherManagerToken: string;
    let receptionistToken: string;
    let foreignReceptionistToken: string;
    let barberId: string;
    let otherBarberId: string;
    let serviceId: string;
    const clients: { id: string; token: string }[] = [];

    const checkIn = (token: string, id: string) =>
        request(app).put(`/api/appointments/${id}/check-in`).set('Authorization', `Bearer ${token}`);

    const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * MS_PER_MINUTE);

    const mk = async (options?: {
        status?: 'scheduled' | 'rescheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
        start?: Date;
        end?: Date;
        clientId?: string | null;
        barber?: string;
        withService?: boolean;
    }) => {
        const start = options?.start ?? minutesFromNow(5);
        const end = options?.end ?? new Date(start.getTime() + 30 * MS_PER_MINUTE);
        const targetBarber = options?.barber ?? barberId;
        const clientId = options?.clientId === undefined ? clients[0].id : options.clientId;
        const id = await insertAppointment(shopId, targetBarber, start, end, {
            ...(clientId ? { clientId } : {}),
            status: options?.status ?? 'scheduled',
        });
        if (options?.withService) {
            await getPool().query(
                `INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking)
                 VALUES ($1, $2, 200, 30)`,
                [id, serviceId]
            );
        }
        return id;
    };

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        managerToken = mintToken(manager.id, 'manager', manager.email);
        shopId = await insertShop(manager.id);

        const otherManager = await insertManager();
        otherManagerToken = mintToken(otherManager.id, 'manager', otherManager.email);
        otherShopId = await insertShop(otherManager.id);

        const shiftId = await getSeededShiftId();
        const receptionist = await insertReceptionist(shopId, shiftId);
        receptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);
        const foreignReceptionist = await insertReceptionist(otherShopId, shiftId);
        foreignReceptionistToken = mintToken(foreignReceptionist.id, 'receptionist', foreignReceptionist.email);

        for (let i = 0; i < 2; i++) {
            const client = await insertUser('client');
            await getPool().query(`INSERT INTO clients (user_id) VALUES ($1)`, [client.id]);
            clients.push({ id: client.id, token: mintToken(client.id, 'client', client.email) });
        }

        barberId = (await insertBarber(shopId)).id;
        otherBarberId = (await insertBarber(shopId)).id;
        serviceId = await insertService({ durationMinutes: 30 });
    });

    afterEach(async () => {
        await getPool().query(`DELETE FROM appointments WHERE shop_id = ANY($1::uuid[])`, [[shopId, otherShopId]]);
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    test('401 sin token', async () => {
        const res = await request(app).put(`/api/appointments/${MISSING_ID}/check-in`);
        expect(res.status).toBe(401);
    });

    test('400 con id inválido', async () => {
        expect((await checkIn(managerToken, 'no-es-uuid')).status).toBe(400);
    });

    test('404 si la cita no existe', async () => {
        expect((await checkIn(managerToken, MISSING_ID)).status).toBe(404);
    });

    test('403 para client (propia, ajena o invitado) y staff de otra sucursal', async () => {
        const own = await mk();
        const others = await mk({ clientId: clients[1].id });
        const guest = await mk({ clientId: null });

        expect((await checkIn(clients[0].token, own)).status).toBe(403);
        expect((await checkIn(clients[0].token, others)).status).toBe(403);
        expect((await checkIn(clients[0].token, guest)).status).toBe(403);
        expect((await checkIn(foreignReceptionistToken, own)).status).toBe(403);
        expect((await checkIn(otherManagerToken, own)).status).toBe(403);
    });

    test('recepción hace check-in a cita scheduled (cliente registrado), guarda checked_in_at, no cambia horarios y bloquea edición/cancelación', async () => {
        const start = minutesFromNow(5);
        const end = new Date(start.getTime() + 30 * MS_PER_MINUTE);
        const id = await mk({ status: 'scheduled', start, end, withService: true });

        const res = await checkIn(receptionistToken, id);
        expect(res.status).toBe(200);
        expect(res.body.error).toBeUndefined();
        expect(Object.keys(res.body).sort()).toEqual(['data', 'message']);
        expect(res.body.message).toBe('Appointment checked in successfully');
        expect(res.body.data.id).toBe(id);
        expect(res.body.data.status).toBe('checked_in');
        expect(res.body.data.checkedInAt).not.toBeNull();
        expect(new Date(res.body.data.scheduledStart).toISOString()).toBe(start.toISOString());
        expect(new Date(res.body.data.scheduledEnd).toISOString()).toBe(end.toISOString());
        expect(res.body.data.client.id).toBe(clients[0].id);
        expect(res.body.data.services).toEqual([{ serviceId, priceAtBooking: 200, durationMinutesAtBooking: 30 }]);

        const row = await getPool().query(
            `SELECT status, checked_in_at, scheduled_start, scheduled_end FROM appointments WHERE id = $1`,
            [id]
        );
        expect(row.rows[0].status).toBe('checked_in');
        expect(row.rows[0].checked_in_at).not.toBeNull();
        expect(new Date(row.rows[0].scheduled_start).toISOString()).toBe(start.toISOString());
        expect(new Date(row.rows[0].scheduled_end).toISOString()).toBe(end.toISOString());

        const editRes = await request(app)
            .put(`/api/appointments/${id}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ notes: 'cambio' });
        expect(editRes.status).toBe(409);

        const cancelRes = await request(app)
            .put(`/api/appointments/${id}/cancel`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({});
        expect(cancelRes.status).toBe(409);
    });

    test('gerente hace check-in a cita rescheduled e invitado', async () => {
        const id = await mk({ status: 'rescheduled', clientId: null });
        const res = await checkIn(managerToken, id);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('checked_in');
        expect(res.body.data.checkedInAt).not.toBeNull();
        expect(res.body.data.client).toBeNull();
        expect(res.body.data.isRegisteredClient).toBe(false);
    });

    test('409 para estados inválidos (checked_in, completed, cancelled, no_show)', async () => {
        for (const status of ['checked_in', 'completed', 'cancelled', 'no_show'] as const) {
            const id = await mk({ status });
            expect((await checkIn(managerToken, id)).status).toBe(409);
        }
    });

    test('409 en doble check-in (secuencial y concurrente)', async () => {
        const seqId = await mk({ barber: barberId });
        expect((await checkIn(receptionistToken, seqId)).status).toBe(200);
        expect((await checkIn(managerToken, seqId)).status).toBe(409);

        const concurrentId = await mk({ barber: otherBarberId });
        const responses = await Promise.all([
            checkIn(managerToken, concurrentId),
            checkIn(receptionistToken, concurrentId),
        ]);
        expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    });

    test('409 si es demasiado pronto (antes de scheduled_start - 15 min)', async () => {
        const id = await mk({ start: minutesFromNow(16) });
        const res = await checkIn(receptionistToken, id);
        expect(res.status).toBe(409);
    });

    test('200 en check-in anticipado cuando el slot previo del barbero está libre o termina en <= scheduled_start - 15 min', async () => {
        const start = minutesFromNow(8);
        // Cita que termina exactamente en scheduled_start - 15 min (no traslapa [start - 15, start))
        await mk({
            start: new Date(start.getTime() - 45 * MS_PER_MINUTE),
            end: new Date(start.getTime() - 15 * MS_PER_MINUTE),
            status: 'scheduled',
        });
        const id = await mk({ start });

        const res = await checkIn(receptionistToken, id);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('checked_in');
    });

    test.each(['scheduled', 'rescheduled', 'checked_in'] as const)(
        '409 en check-in anticipado si el mismo barbero tiene cita previa %s traslapada con [scheduled_start - 15 min, scheduled_start)',
        async (prevStatus) => {
            const start = minutesFromNow(8);
            await mk({
                start: new Date(start.getTime() - 30 * MS_PER_MINUTE),
                end: start,
                status: prevStatus,
            });
            const id = await mk({ start });

            const res = await checkIn(receptionistToken, id);
            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/busy|ocupado/i);
        }
    );

    test.each(['cancelled', 'no_show', 'completed'] as const)(
        '200 en check-in anticipado si la cita previa del mismo barbero está %s',
        async (prevStatus) => {
            const start = minutesFromNow(8);
            await mk({
                start: new Date(start.getTime() - 30 * MS_PER_MINUTE),
                end: start,
                status: prevStatus,
            });
            const id = await mk({ start });

            const res = await checkIn(receptionistToken, id);
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('checked_in');
        }
    );

    test('200 en check-in anticipado si la cita previa pertenece a otro barbero', async () => {
        const start = minutesFromNow(8);
        await mk({
            start: new Date(start.getTime() - 30 * MS_PER_MINUTE),
            end: start,
            status: 'scheduled',
            barber: otherBarberId,
        });
        const id = await mk({ start, barber: barberId });

        const res = await checkIn(receptionistToken, id);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('checked_in');
    });

    test('200 desde scheduled_start aunque el mismo barbero tenga cita previa scheduled/rescheduled/checked_in en el slot anterior', async () => {
        for (const prevStatus of ['scheduled', 'rescheduled', 'checked_in'] as const) {
            await getPool().query(`DELETE FROM appointments WHERE shop_id = $1`, [shopId]);
            const start = minutesFromNow(-3);
            await mk({
                start: new Date(start.getTime() - 30 * MS_PER_MINUTE),
                end: start,
                status: prevStatus,
            });
            const id = await mk({ start });

            const res = await checkIn(receptionistToken, id);
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('checked_in');
        }
    });

    test('409 a partir de scheduled_start + 10 min aunque siga en scheduled o rescheduled', async () => {
        const atExactCutoff = await mk({ status: 'scheduled', start: minutesFromNow(-10) });
        expect((await checkIn(receptionistToken, atExactCutoff)).status).toBe(409);

        const pastCutoff = await mk({ status: 'rescheduled', start: minutesFromNow(-15) });
        expect((await checkIn(managerToken, pastCutoff)).status).toBe(409);
    });
});
