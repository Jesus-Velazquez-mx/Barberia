import connection from '../src/connection/connection.js';
import {
    insertManager,
    insertShop,
    insertUser,
    insertBarber,
    insertAppointment,
    insertRewardAppointment,
    cleanupFixtures,
    createdAppointmentIds,
    LOYALTY_REWARD_THRESHOLD,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const MS_PER_MINUTE = 60_000;

// SQLSTATE de los triggers de recompensa (backend/database/init_database.sql).
const GUEST_REWARD = 'BR001';
const BELOW_THRESHOLD = 'BR002';
const REWARD_ALREADY_OPEN = 'BR003';
const REWARD_FLAG_IMMUTABLE = 'BR004';

type Status = 'scheduled' | 'rescheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

describe('Triggers de cita de recompensa (is_reward_redemption)', () => {
    let shopId: string;
    let barberId: string;
    let slot = 0;

    // Cada cita en su propio horario futuro, para no depender del orden de las pruebas.
    const nextSlot = () => {
        const start = new Date(Date.now() + (48 * 60 + slot++ * 60) * MS_PER_MINUTE);
        return { start, end: new Date(start.getTime() + 30 * MS_PER_MINUTE) };
    };

    const createClient = async (completedServicesCount = 0): Promise<string> => {
        const user = await insertUser('client');
        await getPool().query('INSERT INTO clients (user_id, completed_services_count) VALUES ($1, $2)', [
            user.id,
            completedServicesCount,
        ]);
        return user.id;
    };

    const reward = (clientId: string, status?: Status) => {
        const { start, end } = nextSlot();
        return insertRewardAppointment(shopId, barberId, start, end, clientId, status ? { status } : undefined);
    };

    // INSERT directo con la bandera puesta, sin tocar el contador del cliente.
    const rawRewardInsert = (clientId: string | null, isRegisteredClient = clientId !== null) => {
        const { start, end } = nextSlot();
        return getPool().query(
            `INSERT INTO appointments (shop_id, barber_id, client_id, is_registered_client, guest_client_name,
                                       scheduled_start, scheduled_end, is_reward_redemption)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id`,
            [shopId, barberId, clientId, isRegisteredClient, isRegisteredClient ? null : 'Guest Fixture', start, end]
        );
    };

    const getLoyalty = async (clientId: string): Promise<number> =>
        (await getPool().query('SELECT completed_services_count FROM clients WHERE user_id = $1', [clientId])).rows[0]
            .completed_services_count;

    const setLoyalty = (clientId: string, count: number) =>
        getPool().query('UPDATE clients SET completed_services_count = $2 WHERE user_id = $1', [clientId, count]);

    const setStatus = (id: string, status: Status) =>
        getPool().query('UPDATE appointments SET status = $2 WHERE id = $1', [id, status]);

    beforeAll(async () => {
        await connectDB();
        const manager = await insertManager();
        shopId = await insertShop(manager.id);
        barberId = (await insertBarber(shopId)).id;
    });

    afterEach(async () => {
        const result = await getPool().query('SELECT id FROM appointments WHERE shop_id = $1', [shopId]);
        createdAppointmentIds.push(...result.rows.map((r: { id: string }) => r.id));
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    describe('BEFORE INSERT', () => {
        test('acepta la cita de recompensa de un cliente con contador en el umbral', async () => {
            const clientId = await createClient(LOYALTY_REWARD_THRESHOLD);
            const { rows } = await rawRewardInsert(clientId);
            const row = await getPool().query('SELECT is_reward_redemption FROM appointments WHERE id = $1', [
                rows[0].id,
            ]);
            expect(row.rows[0].is_reward_redemption).toBe(true);
            createdAppointmentIds.push(rows[0].id);
        });

        test('rechaza si el contador del cliente es menor a 6', async () => {
            const clientId = await createClient(LOYALTY_REWARD_THRESHOLD - 1);
            await expect(rawRewardInsert(clientId)).rejects.toMatchObject({ code: BELOW_THRESHOLD });
            await expect(rawRewardInsert(await createClient(0))).rejects.toMatchObject({ code: BELOW_THRESHOLD });
        });

        test('rechaza invitados y clientes eliminados (client_id nulo)', async () => {
            await expect(rawRewardInsert(null, false)).rejects.toMatchObject({ code: GUEST_REWARD });
            await expect(rawRewardInsert(null, true)).rejects.toMatchObject({ code: GUEST_REWARD });
        });

        test('no afecta a las citas normales, aunque el cliente no califique', async () => {
            const clientId = await createClient(0);
            const { start, end } = nextSlot();
            await expect(insertAppointment(shopId, barberId, start, end, { clientId })).resolves.toEqual(
                expect.any(String)
            );
            const guest = nextSlot();
            await expect(insertAppointment(shopId, barberId, guest.start, guest.end)).resolves.toEqual(
                expect.any(String)
            );
        });

        test.each(['scheduled', 'rescheduled', 'checked_in'] as const)(
            'rechaza una segunda recompensa mientras otra sigue %s',
            async (status) => {
                const clientId = await createClient(LOYALTY_REWARD_THRESHOLD);
                await reward(clientId, status);
                await expect(rawRewardInsert(clientId)).rejects.toMatchObject({ code: REWARD_ALREADY_OPEN });
            }
        );

        test('toma FOR UPDATE sobre la fila del cliente durante la transacción del INSERT', async () => {
            const clientId = await createClient(LOYALTY_REWARD_THRESHOLD);
            const inserter = await getPool().connect();
            const observer = await getPool().connect();
            try {
                await inserter.query('BEGIN');
                const { start, end } = nextSlot();
                await inserter.query(
                    `INSERT INTO appointments (shop_id, barber_id, client_id, is_registered_client,
                                               scheduled_start, scheduled_end, is_reward_redemption)
                     VALUES ($1, $2, $3, true, $4, $5, true)`,
                    [shopId, barberId, clientId, start, end]
                );
                await expect(
                    observer.query('SELECT 1 FROM clients WHERE user_id = $1 FOR UPDATE NOWAIT', [clientId])
                ).rejects.toMatchObject({ code: '55P03' }); // lock_not_available
            } finally {
                await inserter.query('ROLLBACK');
                inserter.release();
                observer.release();
            }
        });

        test('con dos inserciones concurrentes directas en SQL, exactamente una tiene éxito', async () => {
            const clientId = await createClient(LOYALTY_REWARD_THRESHOLD);
            const connections = await Promise.all([getPool().connect(), getPool().connect()]);

            try {
                await Promise.all(connections.map((c) => c.query('BEGIN')));
                const results = await Promise.allSettled(
                    connections.map(async (c) => {
                        const { start, end } = nextSlot();
                        try {
                            await c.query(
                                `INSERT INTO appointments (shop_id, barber_id, client_id, is_registered_client,
                                                           scheduled_start, scheduled_end, is_reward_redemption)
                                 VALUES ($1, $2, $3, true, $4, $5, true)`,
                                [shopId, barberId, clientId, start, end]
                            );
                            await c.query('COMMIT');
                        } catch (error) {
                            await c.query('ROLLBACK');
                            throw error;
                        }
                    })
                );

                expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
                const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
                expect(rejected).toHaveLength(1);
                expect(rejected[0].reason).toMatchObject({ code: REWARD_ALREADY_OPEN });
            } finally {
                connections.forEach((c) => c.release());
            }

            const open = await getPool().query(
                'SELECT count(*)::int AS n FROM appointments WHERE client_id = $1 AND is_reward_redemption',
                [clientId]
            );
            expect(open.rows[0].n).toBe(1);
        });

        test('tras cancelled el cliente conserva la recompensa y puede volver a recibirla', async () => {
            const clientId = await createClient();
            const first = await reward(clientId);
            await setStatus(first, 'cancelled');

            expect(await getLoyalty(clientId)).toBe(LOYALTY_REWARD_THRESHOLD);
            await expect(rawRewardInsert(clientId)).resolves.toBeDefined();
        });

        test.each(['completed', 'no_show'] as const)(
            'tras %s se permite una nueva recompensa si el contador vuelve a calificar',
            async (status) => {
                const clientId = await createClient();
                const first = await reward(clientId);
                await setStatus(first, status);

                // Con contador en el umbral, completar (resta 6) o no presentarse (reinicia) lo deja en 0,
                // así que de inmediato ya no califica.
                expect(await getLoyalty(clientId)).toBe(0);
                await expect(rawRewardInsert(clientId)).rejects.toMatchObject({ code: BELOW_THRESHOLD });

                await setLoyalty(clientId, LOYALTY_REWARD_THRESHOLD);
                await expect(rawRewardInsert(clientId)).resolves.toBeDefined();
            }
        );
    });

    describe('BEFORE UPDATE (bandera inmutable)', () => {
        test('rechaza activar la bandera en una cita existente', async () => {
            const clientId = await createClient(LOYALTY_REWARD_THRESHOLD);
            const { start, end } = nextSlot();
            const id = await insertAppointment(shopId, barberId, start, end, { clientId });
            await expect(
                getPool().query('UPDATE appointments SET is_reward_redemption = true WHERE id = $1', [id])
            ).rejects.toMatchObject({ code: REWARD_FLAG_IMMUTABLE });
        });

        test('rechaza desactivar la bandera en una cita de recompensa', async () => {
            const id = await reward(await createClient());
            await expect(
                getPool().query('UPDATE appointments SET is_reward_redemption = false WHERE id = $1', [id])
            ).rejects.toMatchObject({ code: REWARD_FLAG_IMMUTABLE });
        });

        test('permite reescribir la bandera con el mismo valor', async () => {
            const id = await reward(await createClient());
            await expect(
                getPool().query('UPDATE appointments SET is_reward_redemption = true WHERE id = $1', [id])
            ).resolves.toMatchObject({ rowCount: 1 });
        });
    });

    describe('ciclo de vida de una cita de recompensa', () => {
        test('editar, reprogramar, hacer check-in y completar sigue funcionando y resta el umbral al contador', async () => {
            const clientId = await createClient();
            const id = await reward(clientId);
            const { start, end } = nextSlot();

            await getPool().query(
                `UPDATE appointments SET notes = 'editada', scheduled_start = $2, scheduled_end = $3, status = 'rescheduled'
                 WHERE id = $1`,
                [id, start, end]
            );
            await getPool().query(
                `UPDATE appointments SET status = 'checked_in', checked_in_at = now() WHERE id = $1`,
                [id]
            );
            // El contador no se revalida fuera del INSERT: sigue en 6 hasta que la cita se completa.
            expect(await getLoyalty(clientId)).toBe(LOYALTY_REWARD_THRESHOLD);

            await getPool().query(`UPDATE appointments SET status = 'completed', completed_at = now() WHERE id = $1`, [
                id,
            ]);
            expect(await getLoyalty(clientId)).toBe(0);

            const row = await getPool().query('SELECT status, is_reward_redemption FROM appointments WHERE id = $1', [
                id,
            ]);
            expect(row.rows[0]).toEqual({ status: 'completed', is_reward_redemption: true });
        });

        test('cambiar el estado no revalida el contador aunque haya bajado del umbral', async () => {
            const clientId = await createClient();
            const id = await reward(clientId);
            await setLoyalty(clientId, 0);

            await expect(setStatus(id, 'checked_in')).resolves.toMatchObject({ rowCount: 1 });
        });

        test('completar conserva el sobrante y el cliente vuelve a calificar si queda en el umbral', async () => {
            const clientId = await createClient();
            const id = await reward(clientId);
            await setLoyalty(clientId, LOYALTY_REWARD_THRESHOLD * 2);

            await setStatus(id, 'completed');
            expect(await getLoyalty(clientId)).toBe(LOYALTY_REWARD_THRESHOLD);
            await expect(rawRewardInsert(clientId)).resolves.toBeDefined();
        });

        test('completar dos veces no descuenta dos veces (solo la transición a completed)', async () => {
            const clientId = await createClient();
            const id = await reward(clientId);
            await setLoyalty(clientId, LOYALTY_REWARD_THRESHOLD + 2);

            await setStatus(id, 'completed');
            await getPool().query(`UPDATE appointments SET notes = 'editada' WHERE id = $1`, [id]);
            await setStatus(id, 'completed');
            expect(await getLoyalty(clientId)).toBe(2);
        });

        test('marcar no-show reinicia el contador a 0, sobrante incluido (trigger de lealtad existente)', async () => {
            const clientId = await createClient();
            const id = await reward(clientId);
            await setLoyalty(clientId, LOYALTY_REWARD_THRESHOLD + 2);

            await setStatus(id, 'no_show');
            expect(await getLoyalty(clientId)).toBe(0);
        });

        test('una cita normal completada sigue sumando al contador', async () => {
            const clientId = await createClient(2);
            const { start, end } = nextSlot();
            const id = await insertAppointment(shopId, barberId, start, end, { clientId, status: 'checked_in' });

            await setStatus(id, 'completed');
            expect(await getLoyalty(clientId)).toBe(3);
        });
    });
});
