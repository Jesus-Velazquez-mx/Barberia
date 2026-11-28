import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
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
    cleanupFixtures,
    getSeededShiftId,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

const DAY_MS = 86_400_000;
const addDays = (date: string, days: number): string =>
    new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
const dayOfWeek = (date: string): number => new Date(`${date}T00:00:00Z`).getUTCDay();
const wallClock = (date: string, time: string): number =>
    businessWallClockToUtcMs(Date.parse(`${date}T${time}:00.000Z`));

describe('Recompensa de lealtad al agendar', () => {
    let barberId: string;
    let otherBarberId: string;
    let cheapId: string; // $150
    let expensiveId: string; // $450
    let cheaperId: string; // $100
    let tieIds: string[]; // dos servicios de $200
    let manager: User;
    let receptionist: User;
    let dateStr: string;
    let walkInDay: string;

    const at = (time: string) => new Date(wallClock(dateStr, time)).toISOString();
    const managerToken = () => mintToken(manager.id, 'manager', manager.email);
    const receptionistToken = () => mintToken(receptionist.id, 'receptionist', receptionist.email);

    const newService = async (price: number): Promise<string> => {
        const id = await insertService({ durationMinutes: 30 });
        await getPool().query('UPDATE services SET price = $2 WHERE id = $1', [id, price]);
        return id;
    };

    const newClient = async (completedServicesCount: number) => {
        const user = await insertUser('client');
        await getPool().query('INSERT INTO clients (user_id, completed_services_count) VALUES ($1, $2)', [
            user.id,
            completedServicesCount,
        ]);
        return { id: user.id, token: mintToken(user.id, 'client', user.email) };
    };

    const book = (token: string, body: Record<string, unknown> = {}) =>
        request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${token}`)
            .send({ barberId, serviceIds: [cheapId, expensiveId], scheduledStart: at('12:00'), ...body });

    const edit = (token: string, id: string, body: Record<string, unknown>) =>
        request(app).put(`/api/appointments/${id}`).set('Authorization', `Bearer ${token}`).send(body);

    const setStatus = (id: string, status: string) =>
        getPool().query('UPDATE appointments SET status = $2 WHERE id = $1', [id, status]);

    const counterOf = async (clientId: string): Promise<number> => {
        const result = await getPool().query('SELECT completed_services_count AS n FROM clients WHERE user_id = $1', [
            clientId,
        ]);
        return result.rows[0].n;
    };

    const deleteAppointments = () =>
        getPool().query('DELETE FROM appointments WHERE barber_id = ANY($1::uuid[])', [[barberId, otherBarberId]]);

    const expectNormal = (data: Record<string, unknown>, amountDue = 600) => {
        expect(data.isRewardRedemption).toBe(false);
        expect(data.rewardDiscount).toBeNull();
        expect(data.amountDue).toBe(amountDue);
    };

    const expectReward = (data: Record<string, unknown>, serviceId = cheapId, amount = 150, amountDue = 450) => {
        expect(data.isRewardRedemption).toBe(true);
        expect(data.rewardDiscount).toEqual({ serviceId, amount });
        expect(data.amountDue).toBe(amountDue);
    };

    beforeAll(async () => {
        await connectDB();

        manager = (await insertManager()) as unknown as User;
        const shopId = await insertShop(manager.id);

        receptionist = (await insertUser('receptionist')) as unknown as User;
        await getPool().query('INSERT INTO receptionists (user_id, shop_id, shift_id) VALUES ($1, $2, $3)', [
            receptionist.id,
            shopId,
            await getSeededShiftId(),
        ]);

        barberId = (await insertBarber(shopId)).id;
        otherBarberId = (await insertBarber(shopId)).id;
        cheapId = await newService(150);
        expensiveId = await newService(450);
        cheaperId = await newService(100);
        tieIds = [await newService(200), await newService(200)];

        dateStr = addDays(getBusinessToday(), 2);
        if (dayOfWeek(dateStr) === 0) dateStr = addDays(dateStr, 1);

        walkInDay = addDays(getBusinessToday(), 1);
        while (dayOfWeek(walkInDay) !== 3) walkInDay = addDays(walkInDay, 1);
    });

    // Cada prueba empieza con la agenda vacía para poder reutilizar horarios.
    afterEach(async () => {
        jest.restoreAllMocks();
        await deleteAppointments();
    });

    afterAll(async () => {
        await getPool().query('DELETE FROM receptionists WHERE user_id = $1', [receptionist.id]);
        await cleanupFixtures();
        await closeDB();
    });

    describe('al crear', () => {
        test('contador 6: el servicio más barato es gratis y los snapshots no cambian', async () => {
            const client = await newClient(6);
            const res = await book(client.token);

            expect(res.status).toBe(201);
            expectReward(res.body.data);

            const snapshots = await getPool().query(
                `SELECT service_id, price_at_booking, duration_minutes_at_booking FROM appointment_services
                 WHERE appointment_id = $1 ORDER BY price_at_booking`,
                [res.body.data.id]
            );
            expect(
                snapshots.rows.map((r) => [r.service_id, Number(r.price_at_booking), r.duration_minutes_at_booking])
            ).toEqual([
                [cheapId, 150, 30],
                [expensiveId, 450, 30],
            ]);
        });

        test('crear, obtener y listar devuelven los mismos valores', async () => {
            const client = await newClient(6);
            const { id } = (await book(client.token)).body.data;
            const auth = `Bearer ${client.token}`;

            const one = await request(app).get(`/api/appointments/${id}`).set('Authorization', auth);
            const list = await request(app).get('/api/appointments').set('Authorization', auth);

            expectReward(one.body.data);
            expectReward(list.body.data.find((a: { id: string }) => a.id === id));
        });

        test('un solo servicio: la cita completa es gratis', async () => {
            const client = await newClient(6);
            const res = await book(client.token, { serviceIds: [expensiveId] });

            expectReward(res.body.data, expensiveId, 450, 0);
        });

        // El orden en que llegan los servicios no se controla desde la petición; el desempate en ambos órdenes
        // se prueba en rewardDiscount.test.ts.
        test('empate de precio: gana el menor serviceId', async () => {
            const client = await newClient(6);
            const res = await book(client.token, { serviceIds: tieIds });

            expectReward(res.body.data, [...tieIds].sort()[0], 200, 200);
        });

        test.each([
            ['con recompensa', 6, 220.1],
            ['sin recompensa', 5, 300.4],
        ])('precios con centavos %s: amountDue es exacto', async (_case, counter, amountDue) => {
            // Sumados como punto flotante dan 220.10000000000002 y 300.40000000000003.
            const serviceIds = [await newService(99.9), await newService(120.2), await newService(80.3)];
            const client = await newClient(counter);

            const res = await book(client.token, { serviceIds });

            expect(res.status).toBe(201);
            expect(res.body.data.amountDue).toBe(amountDue);
        });

        test('contador 5: cita normal aunque el cuerpo pida la recompensa', async () => {
            const client = await newClient(5);
            const res = await book(client.token, { isRewardRedemption: true });

            expect(res.status).toBe(201);
            expectNormal(res.body.data);
        });

        test.each(['scheduled', 'rescheduled', 'checked_in'])(
            'con una recompensa abierta en %s la siguiente es normal',
            async (status) => {
                const client = await newClient(6);
                const first = await book(client.token);
                await setStatus(first.body.data.id, status);

                const second = await book(client.token, { scheduledStart: at('13:00') });

                expect(second.status).toBe(201);
                expectNormal(second.body.data);
            }
        );

        test('un invitado recibe una cita normal', async () => {
            const res = await book(managerToken(), { guestClientName: 'Invitado' });

            expect(res.status).toBe(201);
            expectNormal(res.body.data);
        });

        test.each([
            ['manager', managerToken],
            ['receptionist', receptionistToken],
        ])('%s agenda para un cliente que califica y se aplica la recompensa', async (_role, token) => {
            const client = await newClient(6);
            const res = await book(token(), { clientId: client.id });

            expect(res.status).toBe(201);
            expectReward(res.body.data);
        });

        test('walk-ins: el cliente que califica recibe la recompensa y el invitado no', async () => {
            const client = await newClient(6);
            jest.spyOn(Date, 'now').mockReturnValue(wallClock(walkInDay, '09:00'));
            const walkIn = (time: string, who: Record<string, string>) =>
                book(receptionistToken(), {
                    ...who,
                    isWalkIn: true,
                    scheduledStart: new Date(wallClock(walkInDay, time)).toISOString(),
                });

            const registered = await walkIn('12:00', { clientId: client.id });
            const guest = await walkIn('13:00', { guestClientName: 'Invitado' });

            expect(registered.status).toBe(201);
            expectReward(registered.body.data);
            expect(guest.status).toBe(201);
            expectNormal(guest.body.data);
        });

        test('dos reservas simultáneas del mismo cliente: exactamente una lleva la recompensa', async () => {
            // Barberos distintos: así solo el candado de la fila del cliente las serializa.
            for (let i = 0; i < 5; i++) {
                const client = await newClient(6);
                const responses = await Promise.all([
                    book(client.token, { scheduledStart: at('12:00') }),
                    book(client.token, { barberId: otherBarberId, scheduledStart: at('13:00') }),
                ]);

                expect(responses.map((r) => r.status)).toEqual([201, 201]);
                expect(responses.filter((r) => r.body.data.isRewardRedemption)).toHaveLength(1);
                await deleteAppointments();
            }
        });
    });

    describe('después de crear', () => {
        test('PUT con isRewardRedemption responde 400 y no guarda nada', async () => {
            const client = await newClient(6);
            const { id } = (await book(client.token)).body.data;

            // El campo válido garantiza que el 400 venga de strictObject: si el esquema descartara la bandera,
            // el cuerpo no quedaría vacío y la edición de notas pasaría.
            const res = await edit(client.token, id, { isRewardRedemption: false, notes: 'No debe guardarse' });

            expect(res.status).toBe(400);
            const stored = await getPool().query('SELECT notes, is_reward_redemption FROM appointments WHERE id = $1', [
                id,
            ]);
            expect(stored.rows[0]).toEqual({ notes: null, is_reward_redemption: true });
        });

        test('editar horario, barbero y notas conserva la recompensa', async () => {
            const client = await newClient(6);
            const { id } = (await book(client.token)).body.data;

            const res = await edit(client.token, id, {
                barberId: otherBarberId,
                scheduledStart: at('13:00'),
                notes: 'Cambio de horario',
            });

            expect(res.status).toBe(200);
            expectReward(res.body.data);
        });

        test('editar servicios mueve el descuento al nuevo más barato', async () => {
            const client = await newClient(6);
            const { id } = (await book(client.token)).body.data;

            const res = await edit(client.token, id, { serviceIds: [expensiveId, cheaperId] });

            expect(res.status).toBe(200);
            expectReward(res.body.data, cheaperId, 100, 450);
        });

        test('editar una cita normal no agrega la recompensa', async () => {
            const client = await newClient(5);
            const { id } = (await book(client.token)).body.data;
            await getPool().query('UPDATE clients SET completed_services_count = 6 WHERE user_id = $1', [client.id]);

            const res = await edit(client.token, id, { notes: 'Sin cambios de recompensa' });

            expect(res.status).toBe(200);
            expectNormal(res.body.data);
        });

        test('cancelar conserva contador y bandera, y la siguiente cita lleva la recompensa', async () => {
            const client = await newClient(6);
            const { id } = (await book(client.token)).body.data;

            const cancelled = await request(app)
                .put(`/api/appointments/${id}/cancel`)
                .set('Authorization', `Bearer ${client.token}`);
            const next = await book(client.token);

            expect(cancelled.status).toBe(200);
            expect(cancelled.body.data.isRewardRedemption).toBe(true);
            expect(await counterOf(client.id)).toBe(6);
            expectReward(next.body.data);
        });

        test('no-show de una recompensa reinicia el contador y la siguiente es normal', async () => {
            const client = await newClient(6);
            const { id } = (await book(client.token)).body.data;
            await setStatus(id, 'no_show');

            const next = await book(client.token);

            expect(await counterOf(client.id)).toBe(0);
            expectNormal(next.body.data);
        });
    });
});
