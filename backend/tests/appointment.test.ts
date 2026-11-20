import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getBusinessToday, businessWallClockToUtcMs } from '../src/utils/businessTime.js';
import { signToken } from '../src/services/jwtTokenService.js';
import { canCreateAppointment, canManageShopWalkIns } from '../src/services/userPermissions.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';
import {
    insertManager,
    insertShop,
    insertUser,
    insertBarber,
    insertService,
    cleanupFixtures,
    createdAppointmentIds,
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

describe('canCreateAppointment', () => {
    test('client solo puede agendar para sí mismo', () => {
        const booking = { shopId: SHOP, shopManagerId: B };
        expect(canCreateAppointment({ id: A, role: 'client' }, { ...booking, clientId: A })).toBe(true);
        expect(canCreateAppointment({ id: A, role: 'client' }, { ...booking, clientId: B })).toBe(false);
        expect(canCreateAppointment({ id: A, role: 'client' }, { ...booking, clientId: null })).toBe(false);
    });

    test('receptionist solo puede agendar en su sucursal', () => {
        const booking = { clientId: null, shopId: SHOP, shopManagerId: B };
        expect(canCreateAppointment({ id: A, role: 'receptionist' }, booking, SHOP)).toBe(true);
        expect(canCreateAppointment({ id: A, role: 'receptionist' }, booking, B)).toBe(false);
        expect(canCreateAppointment({ id: A, role: 'receptionist' }, booking)).toBe(false);
    });

    test('manager solo puede agendar en las sucursales que administra', () => {
        const booking = { clientId: null, shopId: SHOP };
        expect(canCreateAppointment({ id: A, role: 'manager' }, { ...booking, shopManagerId: A })).toBe(true);
        expect(canCreateAppointment({ id: A, role: 'manager' }, { ...booking, shopManagerId: B })).toBe(false);
    });
});

describe('canManageShopWalkIns', () => {
    test('client nunca puede gestionar walk-ins', () => {
        expect(canManageShopWalkIns({ id: A, role: 'client' }, { shopId: SHOP, shopManagerId: B }, SHOP)).toBe(false);
    });

    test('receptionist solo puede gestionar walk-ins en su sucursal', () => {
        expect(canManageShopWalkIns({ id: A, role: 'receptionist' }, { shopId: SHOP, shopManagerId: B }, SHOP)).toBe(true);
        expect(canManageShopWalkIns({ id: A, role: 'receptionist' }, { shopId: SHOP, shopManagerId: B }, 'other-shop')).toBe(false);
    });

    test('manager solo puede gestionar walk-ins en las sucursales que administra', () => {
        expect(canManageShopWalkIns({ id: A, role: 'manager' }, { shopId: SHOP, shopManagerId: A })).toBe(true);
        expect(canManageShopWalkIns({ id: A, role: 'manager' }, { shopId: SHOP, shopManagerId: B })).toBe(false);
    });
});

describe('POST /api/appointments', () => {
    let shopId: string;
    let barberId: string;
    let serviceId: string;
    let shortServiceId: string;
    let dateStr: string;
    let managerToken: string;
    let otherManagerToken: string;
    let foreignReceptionistToken: string;
    let receptionistId: string;
    let localReceptionistId: string;
    let managerUser: User;
    let localReceptionistUser: User;
    const clientIds: string[] = [];
    const clientTokens: string[] = [];

    // Hora de pared de la sucursal (dígitos literales) -> instante UTC real, igual que hace el servicio.
    const at = (time: string) =>
        new Date(businessWallClockToUtcMs(Date.parse(`${dateStr}T${time}:00.000Z`))).toISOString();
    const book = (token: string, body: Record<string, unknown>) =>
        request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${token}`)
            .send({ barberId, serviceIds: [serviceId], ...body });

    beforeAll(async () => {
        await connectDB();

        managerUser = (await insertManager()) as unknown as User;
        managerToken = mintToken(managerUser.id, 'manager', managerUser.email);
        shopId = await insertShop(managerUser.id);
        const otherShopId = await insertShop(managerUser.id);

        const otherManager = await insertManager();
        otherManagerToken = mintToken(otherManager.id, 'manager', otherManager.email);

        // Recepcionista de otra sucursal
        const receptionist = await insertUser('receptionist');
        receptionistId = receptionist.id;
        const shiftId = await getSeededShiftId();
        await getPool().query(`INSERT INTO receptionists (user_id, shop_id, shift_id) VALUES ($1, $2, $3)`, [
            receptionist.id,
            otherShopId,
            shiftId,
        ]);
        foreignReceptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);

        // Recepcionista de la misma sucursal
        localReceptionistUser = (await insertUser('receptionist')) as unknown as User;
        localReceptionistId = localReceptionistUser.id;
        await getPool().query(`INSERT INTO receptionists (user_id, shop_id, shift_id) VALUES ($1, $2, $3)`, [
            localReceptionistUser.id,
            shopId,
            shiftId,
        ]);

        for (let i = 0; i < 2; i++) {
            const client = await insertUser('client');
            await getPool().query(`INSERT INTO clients (user_id) VALUES ($1)`, [client.id]);
            clientIds.push(client.id);
            clientTokens.push(mintToken(client.id, 'client', client.email));
        }

        barberId = (await insertBarber(shopId)).id;
        serviceId = await insertService({ durationMinutes: 30 });
        shortServiceId = await insertService({ durationMinutes: 15 });

        const date = new Date(`${getBusinessToday()}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + 2);
        // Las sucursales cierran domingo: si cae domingo, se recorre un día más.
        if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
        dateStr = date.toISOString().slice(0, 10);
        // 12:00 - 15:00 cae dentro de ambos turnos (mañana 8-16, tarde 12-20)
    });

    afterEach(async () => {
        const result = await getPool().query(`SELECT id FROM appointments WHERE barber_id = $1`, [barberId]);
        createdAppointmentIds.push(...result.rows.map((r: { id: string }) => r.id));
    });

    afterAll(async () => {
        // receptionists.shop_id es RESTRICT: se borra antes de que cleanupFixtures elimine las sucursales
        await getPool().query(`DELETE FROM receptionists WHERE user_id = ANY($1::uuid[])`, [
            [receptionistId, localReceptionistId],
        ]);
        await cleanupFixtures();
        await closeDB();
    });

    test('401 sin token', async () => {
        const res = await request(app).post('/api/appointments').send({});
        expect(res.status).toBe(401);
    });

    test('client agenda para sí mismo y se guarda el snapshot del servicio', async () => {
        const res = await book(clientTokens[0], { scheduledStart: at('12:00') });

        expect(res.status).toBe(201);
        expect(res.body.data).not.toHaveProperty('isRegisteredClient');
        expect(res.body.data).not.toHaveProperty('client');
        expect(new Date(res.body.data.scheduledEnd).toISOString()).toBe(at('12:30'));

        const services = await getPool().query(
            `SELECT duration_minutes_at_booking FROM appointment_services WHERE appointment_id = $1`,
            [res.body.data.id]
        );
        expect(services.rows).toEqual([{ duration_minutes_at_booking: 30 }]);
    });

    test('dos reservas simultáneas del mismo horario: solo una se crea', async () => {
        const responses = await Promise.all(clientTokens.map((token) => book(token, { scheduledStart: at('13:00') })));

        expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
        const count = await getPool().query(
            `SELECT count(*)::int AS n FROM appointments WHERE barber_id = $1 AND scheduled_start = $2`,
            [barberId, at('13:00')]
        );
        expect(count.rows[0].n).toBe(1);
    });

    test('409 si el horario no es uno de los ofrecidos', async () => {
        const res = await book(clientTokens[0], { scheduledStart: at('12:05') });
        expect(res.status).toBe(409);
    });

    test('403 si un client intenta agendar para un invitado', async () => {
        const res = await book(clientTokens[0], { scheduledStart: at('13:30'), guestClientName: 'Invitado' });
        expect(res.status).toBe(403);
    });

    test('403 si un receptionist agenda en una sucursal que no es la suya', async () => {
        const res = await book(foreignReceptionistToken, { scheduledStart: at('13:30'), guestClientName: 'Invitado' });
        expect(res.status).toBe(403);
    });

    test('manager de la sucursal agenda para un invitado', async () => {
        const res = await book(managerToken, { scheduledStart: at('13:30'), guestClientName: 'Invitado' });

        expect(res.status).toBe(201);
        expect(res.body.data.isRegisteredClient).toBe(false);
        expect(res.body.data.guestClientName).toBe('Invitado');
    });

    test('una cita con varios servicios suma sus duraciones y guarda cada servicio', async () => {
        const res = await book(clientTokens[0], {
            scheduledStart: at('14:00'),
            serviceIds: [serviceId, shortServiceId],
        });

        expect(res.status).toBe(201);
        expect(res.body.data.barberId).toBe(barberId);
        expect(new Date(res.body.data.scheduledEnd).toISOString()).toBe(at('14:45'));
        expect(res.body.data.services).toEqual(
            expect.arrayContaining([
                { serviceId, priceAtBooking: 200, durationMinutesAtBooking: 30 },
                { serviceId: shortServiceId, priceAtBooking: 200, durationMinutesAtBooking: 15 },
            ])
        );
        expect(res.body.data.services).toHaveLength(2);

        const services = await getPool().query(
            `SELECT service_id, duration_minutes_at_booking FROM appointment_services WHERE appointment_id = $1
             ORDER BY duration_minutes_at_booking DESC`,
            [res.body.data.id]
        );
        expect(services.rows).toEqual([
            { service_id: serviceId, duration_minutes_at_booking: 30 },
            { service_id: shortServiceId, duration_minutes_at_booking: 15 },
        ]);
    });

    test('409 si la suma de duraciones no cabe en el hueco', async () => {
        // 12:30 - 13:00 está libre, pero 45 min chocan con la cita de las 13:00
        const res = await book(clientTokens[0], {
            scheduledStart: at('12:30'),
            serviceIds: [serviceId, shortServiceId],
        });
        expect(res.status).toBe(409);
    });

    test('400 con serviceIds vacío o repetido', async () => {
        expect((await book(clientTokens[0], { scheduledStart: at('12:30'), serviceIds: [] })).status).toBe(400);
        const dup = await book(clientTokens[0], { scheduledStart: at('12:30'), serviceIds: [serviceId, serviceId] });
        expect(dup.status).toBe(400);
    });

    describe('Walk-ins (isWalkIn: true)', () => {
        const DAY_MS = 86_400_000;
        const addDays = (d: string, days: number) =>
            new Date(Date.parse(`${d}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
        const nextDayOfWeek = (d: string, dayOfWeek: number) => {
            let cur = d;
            while (new Date(`${cur}T00:00:00Z`).getUTCDay() !== dayOfWeek) cur = addDays(cur, 1);
            return cur;
        };
        const WEDNESDAY = nextDayOfWeek(addDays(getBusinessToday(), 1), 3);
        const atToday = (time: string) =>
            new Date(businessWallClockToUtcMs(Date.parse(`${WEDNESDAY}T${time}:00.000Z`))).toISOString();

        test('403 si un client intenta agendar con isWalkIn = true', async () => {
            const res = await book(clientTokens[0], { scheduledStart: at('12:30'), isWalkIn: true });
            expect(res.status).toBe(403);
        });

        test('403 si un receptionist de otra sucursal intenta agendar un walk-in', async () => {
            const res = await book(foreignReceptionistToken, {
                scheduledStart: at('12:30'),
                isWalkIn: true,
                guestClientName: 'Invitado',
            });
            expect(res.status).toBe(403);
        });

        test('403 si un manager de otra sucursal intenta agendar un walk-in', async () => {
            const res = await book(otherManagerToken, {
                scheduledStart: at('12:30'),
                isWalkIn: true,
                guestClientName: 'Invitado',
            });
            expect(res.status).toBe(403);
        });

        test('400 si un walk-in se agenda para otro día que no sea hoy', async () => {
            // dateStr está configurado a 2 días después de hoy
            const res = await book(managerToken, {
                scheduledStart: at('12:30'),
                isWalkIn: true,
                guestClientName: 'Invitado',
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/current business day/i);
        });

        describe('Walk-ins del día actual', () => {
            const curManagerToken = () => mintToken(managerUser.id, 'manager', managerUser.email);
            const curLocalReceptionistToken = () =>
                mintToken(localReceptionistUser.id, 'receptionist', localReceptionistUser.email);

            beforeEach(() => {
                jest.spyOn(Date, 'now').mockReturnValue(
                    new Date(businessWallClockToUtcMs(Date.parse(`${WEDNESDAY}T09:00:00.000Z`))).getTime()
                );
            });

            afterEach(() => {
                jest.restoreAllMocks();
            });

            test('manager crea un walk-in hoy para un invitado', async () => {
                const res = await book(curManagerToken(), {
                    scheduledStart: atToday('10:00'),
                    isWalkIn: true,
                    guestClientName: 'Walk-in Invitado',
                });

                expect(res.status).toBe(201);
                expect(res.body.data.isWalkIn).toBe(true);
                expect(res.body.data.status).toBe('scheduled');
                expect(res.body.data.isRegisteredClient).toBe(false);
                expect(res.body.data.guestClientName).toBe('Walk-in Invitado');
            });

            test('receptionist de la sucursal crea un walk-in hoy para un cliente registrado', async () => {
                const res = await book(curLocalReceptionistToken(), {
                    scheduledStart: atToday('10:30'),
                    isWalkIn: true,
                    clientId: clientIds[0],
                });

                expect(res.status).toBe(201);
                expect(res.body.data.isWalkIn).toBe(true);
                expect(res.body.data.status).toBe('scheduled');
                expect(res.body.data.isRegisteredClient).toBe(true);
                expect(res.body.data.client.id).toBe(clientIds[0]);
            });

            test('409 si el horario del walk-in ya está ocupado', async () => {
                // 10:00 ya fue reservado en el test anterior
                const res = await book(curManagerToken(), {
                    scheduledStart: atToday('10:00'),
                    isWalkIn: true,
                    guestClientName: 'Segundo Invitado',
                });
                expect(res.status).toBe(409);
            });

            test('409 si el horario del walk-in no es un slot válido', async () => {
                const res = await book(curManagerToken(), {
                    scheduledStart: atToday('10:05'),
                    isWalkIn: true,
                    guestClientName: 'Desalineado',
                });
                expect(res.status).toBe(409);
            });

            test('dos walk-ins simultáneos del mismo horario: solo uno se crea', async () => {
                const responses = await Promise.all([
                    book(curManagerToken(), {
                        scheduledStart: atToday('11:00'),
                        isWalkIn: true,
                        guestClientName: 'Primero',
                    }),
                    book(curLocalReceptionistToken(), {
                        scheduledStart: atToday('11:00'),
                        isWalkIn: true,
                        guestClientName: 'Segundo',
                    }),
                ]);

                expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
            });

            test('sin isWalkIn se crea como cita normal (isWalkIn = false)', async () => {
                const res = await book(curManagerToken(), {
                    scheduledStart: atToday('11:30'),
                    guestClientName: 'Cita Normal',
                });

                expect(res.status).toBe(201);
                expect(res.body.data.isWalkIn).toBe(false);
            });
        });
    });
});
