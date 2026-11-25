import connection from '../src/connection/connection.js';
import { completeAppointmentsJob } from '../src/jobs/completeAppointmentsJob.js';
import { buildJobGroups } from '../src/jobs/index.js';
import { createJobRunner } from '../src/jobs/jobRunner.js';
import { completeFinishedAppointments } from '../src/services/appointmentService.js';
import {
    insertManager,
    insertShop,
    insertBarber,
    insertUser,
    getSeededShiftId,
    insertAppointment,
    insertRewardAppointment,
    cleanupFixtures,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const MS_PER_MINUTE = 60 * 1000;

type Status = 'scheduled' | 'rescheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

describe('completeAppointmentsJob unit & registration', () => {
    it('tiene el nombre de job esperado', () => {
        expect(completeAppointmentsJob.name).toBe('complete-checked-in-appointments');
    });

    it('está registrado entre el auto check-in de walk-ins y el no-show', () => {
        const groups = buildJobGroups({ JOBS_INTERVAL_MS: 60_000, REMINDERS_JOB_INTERVAL_MS: 60_000 });
        const statusGroup = groups.find((g) => g.name === 'appointment-status');
        expect(statusGroup).toBeDefined();
        expect(statusGroup!.jobs.map((j) => j.name)).toEqual([
            'auto-check-in-walk-ins',
            'complete-checked-in-appointments',
            'mark-appointments-no-show',
        ]);
    });
});

describe('Auto-complete de citas (business rules & database integration)', () => {
    let shopId: string;
    let barberId: string;

    const createClient = async (): Promise<string> => {
        const user = await insertUser('client');
        await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [user.id]);
        return user.id;
    };

    const createAppointmentFixture = async (options: {
        start: Date;
        end?: Date;
        status?: Status;
        isWalkIn?: boolean;
        clientId?: string;
    }) => {
        const end = options.end ?? new Date(options.start.getTime() + 30 * MS_PER_MINUTE);
        return insertAppointment(shopId, barberId, options.start, end, {
            isWalkIn: options.isWalkIn ?? false,
            status: options.status ?? 'checked_in',
            ...(options.clientId ? { clientId: options.clientId } : {}),
        });
    };

    const getAppointment = async (id: string) =>
        (await getPool().query('SELECT status, completed_at, scheduled_end FROM appointments WHERE id = $1', [id])).rows[0];

    const getLoyalty = async (clientId: string): Promise<number> =>
        (await getPool().query(`SELECT completed_services_count AS count FROM clients WHERE user_id = $1`, [clientId])).rows[0].count;

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        const shiftId = await getSeededShiftId('morning');
        shopId = await insertShop(manager.id);
        const barber = await insertBarber(shopId, { shiftId });
        barberId = barber.id;
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    it('no completa antes de scheduled_end', async () => {
        const start = new Date('2026-11-22T10:00:00.000Z');
        const end = new Date('2026-11-22T10:45:00.000Z');
        const id = await createAppointmentFixture({ start, end });

        await completeFinishedAppointments(new Date(end.getTime() - 1000));

        const row = await getAppointment(id);
        expect(row.status).toBe('checked_in');
        expect(row.completed_at).toBeNull();
    });

    it('completa exacto en el límite con completed_at = scheduled_end', async () => {
        const start = new Date('2026-11-22T11:00:00.000Z');
        const end = new Date('2026-11-22T11:45:00.000Z');
        const id = await createAppointmentFixture({ start, end });

        const affected = await completeFinishedAppointments(end);
        expect(affected).toBeGreaterThanOrEqual(1);

        const row = await getAppointment(id);
        expect(row.status).toBe('completed');
        expect(new Date(row.completed_at).toISOString()).toBe(end.toISOString());
    });

    it('usa scheduled_end y no la hora de corrida para completed_at', async () => {
        const start = new Date('2026-11-22T12:00:00.000Z');
        const end = new Date('2026-11-22T12:45:00.000Z');
        const id = await createAppointmentFixture({ start, end });

        await completeFinishedAppointments(new Date(end.getTime() + 3 * 60 * MS_PER_MINUTE));

        const row = await getAppointment(id);
        expect(row.status).toBe('completed');
        expect(new Date(row.completed_at).toISOString()).toBe(end.toISOString());
    });

    it('ignora estados distintos de checked_in', async () => {
        const start = new Date('2026-11-22T13:00:00.000Z');
        const end = new Date('2026-11-22T13:45:00.000Z');
        const statuses: Status[] = ['scheduled', 'rescheduled', 'cancelled', 'no_show', 'completed'];

        const ids: string[] = [];
        for (const status of statuses) {
            ids.push(await createAppointmentFixture({ start, end, status }));
        }

        await completeFinishedAppointments(new Date(end.getTime() + 60 * MS_PER_MINUTE));

        for (const [i, status] of statuses.entries()) {
            expect((await getAppointment(ids[i])).status).toBe(status);
        }
    });

    it('es idempotente: re-ejecutarlo no cambia la cita ni vuelve a sumar al contador', async () => {
        const clientId = await createClient();
        const start = new Date('2026-11-22T14:00:00.000Z');
        const end = new Date('2026-11-22T14:45:00.000Z');
        const now = new Date(end.getTime() + 5 * MS_PER_MINUTE);
        const id = await createAppointmentFixture({ start, end, clientId });
        const before = await getLoyalty(clientId);

        const firstRun = await completeFinishedAppointments(now);
        expect(firstRun).toBeGreaterThanOrEqual(1);

        const secondRun = await completeFinishedAppointments(now);
        expect(secondRun).toBe(0);

        const laterRun = await completeFinishedAppointments(new Date(now.getTime() + 60 * MS_PER_MINUTE));
        expect(laterRun).toBe(0);

        const row = await getAppointment(id);
        expect(row.status).toBe('completed');
        expect(new Date(row.completed_at).toISOString()).toBe(end.toISOString());
        expect(await getLoyalty(clientId)).toBe(before + 1);
    });

    it('corridas concurrentes no duplican efectos (el contador suma +1 una sola vez)', async () => {
        const clientId = await createClient();
        const start = new Date('2026-11-22T15:00:00.000Z');
        const end = new Date('2026-11-22T15:45:00.000Z');
        const now = new Date(end.getTime() + 5 * MS_PER_MINUTE);
        await createAppointmentFixture({ start, end, clientId });
        const before = await getLoyalty(clientId);

        await Promise.all([completeFinishedAppointments(now), completeFinishedAppointments(now)]);

        expect(await getLoyalty(clientId)).toBe(before + 1);
    });

    it('una cita reprogramada usa su scheduled_end vigente', async () => {
        /* Cita originalmente a las 09:00-09:45, reprogramada a 16:00-16:45 y ya con check-in */
        const originalEnd = new Date('2026-11-22T09:45:00.000Z');
        const newStart = new Date('2026-11-22T16:00:00.000Z');
        const newEnd = new Date('2026-11-22T16:45:00.000Z');
        const id = await createAppointmentFixture({ start: newStart, end: newEnd });

        /* Con el end original ya pasado, pero antes del vigente: no completa */
        await completeFinishedAppointments(new Date(originalEnd.getTime() + 60 * MS_PER_MINUTE));
        expect((await getAppointment(id)).status).toBe('checked_in');

        /* En el end vigente: completa con completed_at = end vigente */
        await completeFinishedAppointments(newEnd);
        const row = await getAppointment(id);
        expect(row.status).toBe('completed');
        expect(new Date(row.completed_at).toISOString()).toBe(newEnd.toISOString());
    });

    it('incluye walk-ins (con cliente) y suma +1 al contador', async () => {
        const clientId = await createClient();
        const start = new Date('2026-11-22T17:00:00.000Z');
        const end = new Date('2026-11-22T17:45:00.000Z');
        const id = await createAppointmentFixture({ start, end, isWalkIn: true, clientId });
        const before = await getLoyalty(clientId);

        await completeFinishedAppointments(end);

        expect((await getAppointment(id)).status).toBe('completed');
        expect(await getLoyalty(clientId)).toBe(before + 1);
    });

    it('incluye citas de invitado (sin cliente) y no toca ningún contador', async () => {
        const bystander = await createClient();
        const start = new Date('2026-11-22T18:00:00.000Z');
        const end = new Date('2026-11-22T18:45:00.000Z');
        /* Sin clientId: cita de invitado */
        const guestWalkIn = await createAppointmentFixture({ start, end, isWalkIn: true });
        const guestRegular = await createAppointmentFixture({
            start: new Date('2026-11-22T19:00:00.000Z'),
            end: new Date('2026-11-22T19:45:00.000Z'),
            isWalkIn: false,
        });
        const before = await getLoyalty(bystander);

        await completeFinishedAppointments(new Date('2026-11-22T19:45:00.000Z'));

        expect((await getAppointment(guestWalkIn)).status).toBe('completed');
        expect((await getAppointment(guestRegular)).status).toBe('completed');
        expect(await getLoyalty(bystander)).toBe(before);
    });

    it('el job devuelve la cantidad de citas completadas y usa ctx.now', async () => {
        const start = new Date('2026-11-22T20:00:00.000Z');
        const end = new Date('2026-11-22T20:45:00.000Z');
        const id = await createAppointmentFixture({ start, end });

        const result = await completeAppointmentsJob.run({ now: end });

        expect(result).toEqual({ affected: expect.any(Number) });
        expect((result as { affected: number }).affected).toBeGreaterThanOrEqual(1);
        expect((await getAppointment(id)).status).toBe('completed');
    });

    it('cadena completa en el runner con el job real: walk-in scheduled → checked_in → completed en una corrida', async () => {
        const buildGroups = buildJobGroups({ JOBS_INTERVAL_MS: 60_000, REMINDERS_JOB_INTERVAL_MS: 60_000 });
        const statusGroup = buildGroups.find((g) => g.name === 'appointment-status')!;

        const restartNow = new Date('2026-11-22T22:30:00.000Z');
        const start = new Date('2026-11-22T21:00:00.000Z');
        const end = new Date('2026-11-22T21:45:00.000Z');
        const id = await createAppointmentFixture({ start, end, status: 'scheduled', isWalkIn: true });

        const silentLogger = { log: () => {}, warn: () => {}, error: () => {}, debug: () => {} };
        const runner = createJobRunner({
            /* lockKey distinto para no chocar con el grupo real ni con otros tests */
            groups: [{ ...statusGroup, lockKey: 252_998 }],
            getPool,
            clock: () => restartNow,
            logger: silentLogger,
        });

        await expect(runner.runGroupOnce('appointment-status', restartNow)).resolves.toBe('completed');

        const row = await getAppointment(id);
        expect(row.status).toBe('completed');
        expect(new Date(row.completed_at).toISOString()).toBe(end.toISOString());
    });

    it.each([
        [6, 0],
        [8, 2],
        [12, 6],
    ])('con recompensa (is_reward_redemption) y contador %i resta 6 y deja %i', async (before, after) => {
        const clientId = await createClient();

        // La bandera es inmutable: la cita se crea ya como recompensa (el helper fija el contador).
        const start = new Date('2026-11-22T23:00:00.000Z');
        const end = new Date('2026-11-22T23:45:00.000Z');
        const id = await insertRewardAppointment(shopId, barberId, start, end, clientId, {
            status: 'checked_in',
            completedServicesCount: before,
        });

        await completeFinishedAppointments(end);

        expect((await getAppointment(id)).status).toBe('completed');
        expect(await getLoyalty(clientId)).toBe(after);
    });
});