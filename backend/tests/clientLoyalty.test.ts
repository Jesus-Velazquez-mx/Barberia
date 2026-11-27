import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import swaggerJsdoc from 'swagger-jsdoc';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { signToken } from '../src/services/jwtTokenService.js';
import { evaluateReward, LOYALTY_REWARD_THRESHOLD } from '../src/utils/loyalty.js';
import { getLoyaltyStateForUpdate } from '../src/repositories/clientRepository.js';
import { canViewClientLoyalty } from '../src/services/userPermissions.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';
import {
    insertManager,
    insertShop,
    insertBarber,
    insertUser,
    insertReceptionist,
    getSeededShiftId,
    insertRewardAppointment,
    cleanupFixtures,
    createdUserIds,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';
const MS_PER_MINUTE = 60 * 1000;

describe('Programa de lealtad: constante y función pura evaluateReward', () => {
    it('define LOYALTY_REWARD_THRESHOLD igual a 6', () => {
        expect(LOYALTY_REWARD_THRESHOLD).toBe(6);
    });

    it.each([
        { count: 0, hasOpen: false, expected: { rewardAvailable: false, rewardAppliesOnNextBooking: false } },
        { count: 5, hasOpen: false, expected: { rewardAvailable: false, rewardAppliesOnNextBooking: false } },
        { count: 6, hasOpen: false, expected: { rewardAvailable: true, rewardAppliesOnNextBooking: true } },
        { count: 9, hasOpen: false, expected: { rewardAvailable: true, rewardAppliesOnNextBooking: true } },
        { count: 6, hasOpen: true, expected: { rewardAvailable: true, rewardAppliesOnNextBooking: false } },
        { count: 9, hasOpen: true, expected: { rewardAvailable: true, rewardAppliesOnNextBooking: false } },
    ])(
        'evaluateReward($count, $hasOpen) devuelve $expected',
        ({ count, hasOpen, expected }) => {
            expect(evaluateReward(count, hasOpen)).toEqual(expected);
        }
    );
});

describe('Permisos de consulta de lealtad (canViewClientLoyalty)', () => {
    const clientA = '11111111-1111-4111-8111-111111111111';
    const clientB = '22222222-2222-4222-8222-222222222222';

    it('un cliente solo puede consultar su propio estado; el personal puede consultar el de clientes', () => {
        expect(canViewClientLoyalty({ id: clientA, role: 'client' }, clientA)).toBe(true);
        expect(canViewClientLoyalty({ id: clientA, role: 'client' }, clientB)).toBe(false);
        expect(canViewClientLoyalty({ id: 'staff-1', role: 'receptionist' }, clientA)).toBe(true);
        expect(canViewClientLoyalty({ id: 'staff-2', role: 'manager' }, clientA)).toBe(true);
    });
});

describe('GET /api/clients/:id/loyalty y getLoyaltyStateForUpdate', () => {
    let shopId: string;
    let barberId: string;
    let managerToken: string;
    let receptionistToken: string;
    let otherClient: { id: string; email: string };
    let otherClientToken: string;

    const createClientWithCount = async (completedServicesCount = 0) => {
        const user = await insertUser('client');
        await getPool().query(
            `INSERT INTO clients (user_id, completed_services_count) VALUES ($1, $2)`,
            [user.id, completedServicesCount]
        );
        return {
            ...user,
            token: mintToken(user.id, 'client', user.email),
        };
    };

    const setClientCount = (userId: string, count: number) =>
        getPool().query(`UPDATE clients SET completed_services_count = $2 WHERE user_id = $1`, [userId, count]);

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        const shiftId = await getSeededShiftId('morning');
        shopId = await insertShop(manager.id);
        const barber = await insertBarber(shopId, { shiftId });
        barberId = barber.id;
        const receptionist = await insertReceptionist(shopId, shiftId);

        otherClient = await createClientWithCount(0);

        managerToken = mintToken(manager.id, 'manager', manager.email);
        receptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);
        otherClientToken = mintToken(otherClient.id, 'client', otherClient.email);
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    describe('Autorización, validación y envelope estándar', () => {
        it('401 si falta el token o es inválido', async () => {
            const noToken = await request(app).get(`/api/clients/${otherClient.id}/loyalty`);
            expect(noToken.status).toBe(401);

            const badToken = await request(app)
                .get(`/api/clients/${otherClient.id}/loyalty`)
                .set('Authorization', 'Bearer token-invalido');
            expect(badToken.status).toBe(401);
        });

        it('400 si el ID no es un UUID válido', async () => {
            const res = await request(app)
                .get('/api/clients/no-es-uuid/loyalty')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(400);
        });

        it('403 si un cliente intenta consultar el estado de otro cliente', async () => {
            const target = await createClientWithCount(3);
            const res = await request(app)
                .get(`/api/clients/${target.id}/loyalty`)
                .set('Authorization', `Bearer ${otherClientToken}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/permission/i);
        });

        it('404 si el cliente no existe (consultado por personal)', async () => {
            const res = await request(app)
                .get(`/api/clients/${UNKNOWN_UUID}/loyalty`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Client not found/i);
        });

        it('200 cuando el propio cliente, recepcionista o manager consultan el estado con envelope estándar', async () => {
            const client = await createClientWithCount(2);

            for (const token of [client.token, receptionistToken, managerToken]) {
                const res = await request(app)
                    .get(`/api/clients/${client.id}/loyalty`)
                    .set('Authorization', `Bearer ${token}`);

                expect(res.status).toBe(200);
                expect(res.body).toEqual({
                    data: {
                        completedServicesCount: 2,
                        threshold: LOYALTY_REWARD_THRESHOLD,
                        appointmentsUntilReward: 4,
                        rewardAvailable: false,
                        hasOpenRewardAppointment: false,
                        rewardAppliesOnNextBooking: false,
                    },
                    message: 'Client loyalty status retrieved successfully',
                });
            }
        });
    });

    describe('Cálculo de progreso y citas de recompensa abiertas', () => {
        it.each([
            { count: 0, until: 6, available: false, applies: false },
            { count: 5, until: 1, available: false, applies: false },
            { count: 6, until: 0, available: true, applies: true },
            { count: 9, until: 0, available: true, applies: true },
        ])(
            'con contador $count devuelve appointmentsUntilReward=$until, rewardAvailable=$available y rewardAppliesOnNextBooking=$applies',
            async ({ count, until, available, applies }) => {
                const client = await createClientWithCount(count);

                const res = await request(app)
                    .get(`/api/clients/${client.id}/loyalty`)
                    .set('Authorization', `Bearer ${client.token}`);

                expect(res.status).toBe(200);
                expect(res.body.data).toEqual({
                    completedServicesCount: count,
                    threshold: LOYALTY_REWARD_THRESHOLD,
                    appointmentsUntilReward: until,
                    rewardAvailable: available,
                    hasOpenRewardAppointment: false,
                    rewardAppliesOnNextBooking: applies,
                });
            }
        );

        it.each(['scheduled', 'rescheduled', 'checked_in'] as const)(
            'con cita de recompensa abierta en estado %s devuelve rewardAvailable: true y rewardAppliesOnNextBooking: false',
            async (openStatus) => {
                const client = await createClientWithCount(LOYALTY_REWARD_THRESHOLD);
                const start = new Date(Date.now() + 60 * MS_PER_MINUTE);
                const end = new Date(start.getTime() + 30 * MS_PER_MINUTE);

                await insertRewardAppointment(shopId, barberId, start, end, client.id, {
                    status: openStatus,
                    completedServicesCount: LOYALTY_REWARD_THRESHOLD,
                });

                const res = await request(app)
                    .get(`/api/clients/${client.id}/loyalty`)
                    .set('Authorization', `Bearer ${client.token}`);

                expect(res.status).toBe(200);
                expect(res.body.data).toEqual({
                    completedServicesCount: LOYALTY_REWARD_THRESHOLD,
                    threshold: LOYALTY_REWARD_THRESHOLD,
                    appointmentsUntilReward: 0,
                    rewardAvailable: true,
                    hasOpenRewardAppointment: true,
                    rewardAppliesOnNextBooking: false,
                });
            }
        );

        it('citas de recompensa cerradas (cancelled, completed, no_show) no cuentan como cita abierta', async () => {
            const client = await createClientWithCount(LOYALTY_REWARD_THRESHOLD);
            const base = Date.now() + 120 * MS_PER_MINUTE;

            for (const [idx, closedStatus] of (['cancelled', 'completed', 'no_show'] as const).entries()) {
                const start = new Date(base + idx * 45 * MS_PER_MINUTE);
                const end = new Date(start.getTime() + 30 * MS_PER_MINUTE);
                await insertRewardAppointment(shopId, barberId, start, end, client.id, {
                    status: closedStatus,
                    completedServicesCount: LOYALTY_REWARD_THRESHOLD,
                });
                // Si completed/no_show modificaron el contador por trigger, lo restauramos al umbral
                await setClientCount(client.id, LOYALTY_REWARD_THRESHOLD);
            }

            const res = await request(app)
                .get(`/api/clients/${client.id}/loyalty`)
                .set('Authorization', `Bearer ${client.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.hasOpenRewardAppointment).toBe(false);
            expect(res.body.data.rewardAvailable).toBe(true);
            expect(res.body.data.rewardAppliesOnNextBooking).toBe(true);
        });
    });

    describe('getLoyaltyStateForUpdate (transaccional y con candado FOR UPDATE)', () => {
        it('usa el PoolClient de la transacción (sin llamar a getPool) y devuelve null si el cliente no existe', async () => {
            const client = await getPool().connect();
            const getPoolSpy = jest.spyOn(connection, 'getPool');

            try {
                await client.query('BEGIN');
                const state = await getLoyaltyStateForUpdate(client, UNKNOWN_UUID);
                expect(state).toBeNull();
                expect(getPoolSpy).not.toHaveBeenCalled();
                await client.query('ROLLBACK');
            } finally {
                getPoolSpy.mockRestore();
                client.release();
            }
        });

        it('ve la cita de recompensa aún sin confirmar de su propia transacción', async () => {
            const testClient = await createClientWithCount(LOYALTY_REWARD_THRESHOLD);
            const start = new Date(Date.now() + 60 * MS_PER_MINUTE);
            const end = new Date(start.getTime() + 30 * MS_PER_MINUTE);
            const tx = await getPool().connect();

            try {
                await tx.query('BEGIN');
                // Sin confirmar: solo esta conexión la ve, así que leerla por el pool daría false.
                // No usa insertRewardAppointment porque ese helper inserta por el pool.
                await tx.query(
                    `INSERT INTO appointments (shop_id, barber_id, client_id, is_registered_client, scheduled_start, scheduled_end, is_reward_redemption)
                     VALUES ($1, $2, $3, true, $4, $5, true)`,
                    [shopId, barberId, testClient.id, start, end]
                );

                const state = await getLoyaltyStateForUpdate(tx, testClient.id);

                expect(state).toEqual({
                    completedServicesCount: LOYALTY_REWARD_THRESHOLD,
                    hasOpenRewardAppointment: true,
                });
            } finally {
                await tx.query('ROLLBACK');
                tx.release();
            }
        });

        it('bloquea la fila del cliente: una segunda transacción espera hasta que la primera confirma', async () => {
            const testClient = await createClientWithCount(LOYALTY_REWARD_THRESHOLD);
            createdUserIds.push(testClient.id);

            const pool = getPool();
            const tx1 = await pool.connect();
            const tx2 = await pool.connect();

            try {
                await tx1.query('BEGIN');
                const state1 = await getLoyaltyStateForUpdate(tx1, testClient.id);
                expect(state1).toEqual({
                    completedServicesCount: LOYALTY_REWARD_THRESHOLD,
                    hasOpenRewardAppointment: false,
                });

                await tx2.query('BEGIN');
                let tx2Resolved = false;
                const tx2Promise = getLoyaltyStateForUpdate(tx2, testClient.id).then((res) => {
                    tx2Resolved = true;
                    return res;
                });

                // Esperamos brevemente para confirmar que tx2 quedó bloqueada esperando el candado de tx1
                await new Promise((resolve) => setTimeout(resolve, 100));
                expect(tx2Resolved).toBe(false);

                // tx1 modifica el contador y confirma; tx2 debe desbloquearse y ver el estado actualizado
                await tx1.query(`UPDATE clients SET completed_services_count = 9 WHERE user_id = $1`, [testClient.id]);
                await tx1.query('COMMIT');

                const state2 = await tx2Promise;
                expect(tx2Resolved).toBe(true);
                expect(state2).toEqual({
                    completedServicesCount: 9,
                    hasOpenRewardAppointment: false,
                });

                await tx2.query('COMMIT');
            } catch (err) {
                await tx1.query('ROLLBACK').catch(() => {});
                await tx2.query('ROLLBACK').catch(() => {});
                throw err;
            } finally {
                tx1.release();
                tx2.release();
            }
        });
    });

    describe('Documentación OpenAPI (/api-docs)', () => {
        it('incluye el endpoint GET /api/clients/{id}/loyalty en la especificación Swagger', () => {
            const specs = swaggerJsdoc({
                definition: {
                    openapi: '3.0.0',
                    info: { title: 'Barberia API', version: '1.0.0' },
                },
                apis: ['./src/routes/clientRoutes.ts'],
            }) as { paths?: Record<string, { get?: unknown }> };

            expect(specs.paths?.['/api/clients/{id}/loyalty']?.get).toBeDefined();
        });
    });
});
