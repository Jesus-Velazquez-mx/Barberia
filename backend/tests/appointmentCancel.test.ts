import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getBusinessToday, businessWallClockToUtcMs } from '../src/utils/businessTime.js';
import { signToken } from '../src/services/jwtTokenService.js';
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

const MS_PER_HOUR = 60 * 60 * 1000;
const MISSING_ID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b'; // UUID v4 válido que no existe

describe('PUT /api/appointments/:id/cancel', () => {
    let shopId: string;
    let otherShopId: string;
    let managerToken: string;
    let otherManagerToken: string;
    let receptionistToken: string;
    let foreignReceptionistToken: string;
    let barber: string;
    let serviceId: string;
    let day: string;
    const clients: { id: string; token: string }[] = [];

    const at = (d: string, time: string) =>
        new Date(businessWallClockToUtcMs(Date.parse(`${d}T${time}:00.000Z`))).toISOString();

    const openDay = (offset: number) => {
        const date = new Date(`${getBusinessToday()}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + offset);
        if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
        return date.toISOString().slice(0, 10);
    };

    const cancel = (token: string, id: string, body?: Record<string, unknown>) =>
        request(app).put(`/api/appointments/${id}/cancel`).set('Authorization', `Bearer ${token}`).send(body);

    const hoursFromNow = (hours: number) => new Date(Date.now() + hours * MS_PER_HOUR);

    // Cita en BD con el estado y el inicio dados (por defecto, dentro de 20 h, del cliente 0).
    const mk = (
        status: 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show' = 'scheduled',
        start = hoursFromNow(20),
        clientId: string | null = clients[0].id
    ) =>
        insertAppointment(shopId, barber, start, new Date(start.getTime() + 30 * 60_000), {
            ...(clientId ? { clientId } : {}),
            status,
        });

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

        barber = (await insertBarber(shopId)).id;
        serviceId = await insertService({ durationMinutes: 30 });
        day = openDay(2);
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
        const res = await request(app).put(`/api/appointments/${MISSING_ID}/cancel`);
        expect(res.status).toBe(401);
    });

    test('404 si la cita no existe', async () => {
        expect((await cancel(managerToken, MISSING_ID)).status).toBe(404);
    });

    test('400 con id inválido, motivo demasiado largo o campos desconocidos', async () => {
        const id = await mk();
        expect((await cancel(managerToken, 'no-es-uuid')).status).toBe(400);
        expect((await cancel(managerToken, id, { reason: 'x'.repeat(256) })).status).toBe(400);
        expect((await cancel(managerToken, id, { status: 'completed' })).status).toBe(400);
    });

    test('el client cancela su propia cita y queda registrada', async () => {
        const id = await mk();
        const res = await cancel(clients[0].token, id, { reason: '  Cambio de planes ' });
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(id);
        expect(res.body.data.status).toBe('cancelled');

        const row = await getPool().query(
            `SELECT status, cancelled_at, cancellation_reason FROM appointments WHERE id = $1`,
            [id]
        );
        expect(row.rows[0].status).toBe('cancelled');
        expect(row.rows[0].cancelled_at).not.toBeNull();
        expect(row.rows[0].cancellation_reason).toBe('Cambio de planes');
    });

    test('recepción y gerencia cancelan sin motivo, incluso citas de invitados', async () => {
        const byReceptionist = await cancel(receptionistToken, await mk('scheduled', undefined, null));
        expect(byReceptionist.status).toBe(200);
        expect(byReceptionist.body.data.status).toBe('cancelled');

        const byManager = await cancel(managerToken, await mk());
        expect(byManager.status).toBe(200);
        expect(byManager.body.data.status).toBe('cancelled');
    });

    test('403 fuera del alcance del rol', async () => {
        const own = await mk();
        const others = await mk('scheduled', undefined, clients[1].id);
        const guest = await mk('scheduled', undefined, null);

        expect((await cancel(clients[0].token, others)).status).toBe(403);
        expect((await cancel(clients[0].token, guest)).status).toBe(403);
        expect((await cancel(foreignReceptionistToken, own)).status).toBe(403);
        expect((await cancel(otherManagerToken, own)).status).toBe(403);
    });

    test('con menos de 8 horas el client no puede cancelar pero el personal sí', async () => {
        const id = await mk('scheduled', hoursFromNow(2));
        expect((await cancel(clients[0].token, id)).status).toBe(403);
        expect((await cancel(receptionistToken, id)).status).toBe(200);
        expect((await cancel(managerToken, await mk('scheduled', hoursFromNow(2)))).status).toBe(200);
    });

    test('409 si la cita ya no está scheduled / rescheduled, ya empezó o ya está cancelada', async () => {
        for (const status of ['checked_in', 'completed', 'cancelled', 'no_show'] as const) {
            expect((await cancel(managerToken, await mk(status))).status).toBe(409);
        }
        const started = await mk('scheduled', hoursFromNow(-1));
        expect((await cancel(managerToken, started)).status).toBe(409);

        const id = await mk();
        expect((await cancel(managerToken, id)).status).toBe(200);
        expect((await cancel(managerToken, id)).status).toBe(409);
    });

    test('conserva la recompensa y los servicios de la cita', async () => {
        const booked = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${clients[0].token}`)
            .send({ barberId: barber, serviceIds: [serviceId], scheduledStart: at(day, '12:00') });
        expect(booked.status).toBe(201);
        const id = booked.body.data.id as string;
        await getPool().query(`UPDATE appointments SET is_reward_redemption = true WHERE id = $1`, [id]);

        expect((await cancel(clients[0].token, id)).status).toBe(200);

        const row = await getPool().query(`SELECT is_reward_redemption FROM appointments WHERE id = $1`, [id]);
        expect(row.rows[0].is_reward_redemption).toBe(true);
        const services = await getPool().query(`SELECT 1 FROM appointment_services WHERE appointment_id = $1`, [id]);
        expect(services.rows.length).toBe(1);
    });

    test('el horario queda libre y la cita cancelada ya no se puede editar', async () => {
        const booked = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${clients[0].token}`)
            .send({ barberId: barber, serviceIds: [serviceId], scheduledStart: at(day, '13:00') });
        expect(booked.status).toBe(201);
        const id = booked.body.data.id as string;

        expect((await cancel(clients[0].token, id)).status).toBe(200);

        const rebook = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${clients[1].token}`)
            .send({ barberId: barber, serviceIds: [serviceId], scheduledStart: at(day, '13:00') });
        expect(rebook.status).toBe(201);

        const edit = await request(app)
            .put(`/api/appointments/${id}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ notes: 'x' });
        expect(edit.status).toBe(409);
    });

    test('dos cancelaciones simultáneas: solo una gana', async () => {
        const id = await mk();
        const responses = await Promise.all([cancel(managerToken, id), cancel(receptionistToken, id)]);
        expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    });
});
