import connection from '../src/connection/connection.js';
import { walkInCheckInJob } from '../src/jobs/walkInCheckInJob.js';
import { autoCheckInWalkIns } from '../src/services/appointmentService.js';
import { markNoShow } from '../src/services/appointmentService.js';
import { buildJobGroups } from '../src/jobs/index.js';
import { createJobRunner } from '../src/jobs/jobRunner.js';
import type { Job } from '../src/jobs/types.js';
import {
    insertManager,
    insertShop,
    insertBarber,
    insertUser,
    getSeededShiftId,
    insertAppointment,
    cleanupFixtures,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const MS_PER_MINUTE = 60 * 1000;

describe('walkInCheckInJob unit & runner integration', () => {
    it('tiene el nombre de job esperado', () => {
        expect(walkInCheckInJob.name).toBe('auto-check-in-walk-ins');
    });

    it('está registrado como el primer job en el grupo appointment-status', () => {
        const groups = buildJobGroups({ JOBS_INTERVAL_MS: 60_000, REMINDERS_JOB_INTERVAL_MS: 60_000 });
        const statusGroup = groups.find((g) => g.name === 'appointment-status');
        expect(statusGroup).toBeDefined();
        expect(statusGroup!.jobs[0].name).toBe('auto-check-in-walk-ins');
        expect(statusGroup!.jobs.map((j) => j.name)).toEqual([
            'auto-check-in-walk-ins',
            'complete-checked-in-appointments',
            'mark-appointments-no-show',
        ]);
    });
});

describe('Walk-in auto check-in (business rules & database integration)', () => {
    let shopId: string;
    let barberId: string;
    let clientId: string;

    const createAppointmentFixture = async (options: {
        start: Date;
        end?: Date;
        isWalkIn?: boolean;
        status?: 'scheduled' | 'rescheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
        clientId?: string;
    }) => {
        const end = options.end ?? new Date(options.start.getTime() + 30 * MS_PER_MINUTE);
        return insertAppointment(shopId, barberId, options.start, end, {
            isWalkIn: options.isWalkIn ?? true,
            status: options.status ?? 'scheduled',
            ...(options.clientId ? { clientId: options.clientId } : {}),
        });
    };

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        const client = await insertUser('client');
        await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [client.id]);
        clientId = client.id;

        const shiftId = await getSeededShiftId('morning');
        shopId = await insertShop(manager.id);
        const barber = await insertBarber(shopId, { shiftId });
        barberId = barber.id;
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    it('antes del inicio no cambia (walk-in con scheduled_start > now permanece scheduled sin checked_in_at)', async () => {
        const now = new Date('2026-11-21T10:00:00.000Z');
        const futureStart = new Date(now.getTime() + 5 * MS_PER_MINUTE);

        const id = await createAppointmentFixture({
            start: futureStart,
            isWalkIn: true,
            status: 'scheduled',
        });

        const affected = await autoCheckInWalkIns(now);
        expect(affected).toBe(0);

        const row = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [id])).rows[0];
        expect(row.status).toBe('scheduled');
        expect(row.checked_in_at).toBeNull();
    });

    it('en el límite exacto pasa a checked_in con checked_in_at = scheduled_start', async () => {
        const exactNow = new Date('2026-11-21T10:30:00.000Z');

        const id = await createAppointmentFixture({
            start: exactNow,
            isWalkIn: true,
            status: 'scheduled',
        });

        const affected = await autoCheckInWalkIns(exactNow);
        expect(affected).toBeGreaterThanOrEqual(1);

        const row = (await getPool().query('SELECT status, checked_in_at, scheduled_start FROM appointments WHERE id = $1', [id])).rows[0];
        expect(row.status).toBe('checked_in');
        expect(new Date(row.checked_in_at).toISOString()).toBe(exactNow.toISOString());
        expect(new Date(row.checked_in_at).toISOString()).toBe(new Date(row.scheduled_start).toISOString());
    });

    it('después del inicio (now > scheduled_start) un walk-in (scheduled o rescheduled) pasa a checked_in', async () => {
        const runAt = new Date('2026-11-21T11:00:00.000Z');
        const pastStart1 = new Date('2026-11-21T10:45:00.000Z');
        const pastStart2 = new Date('2026-11-21T10:50:00.000Z');

        const idScheduled = await createAppointmentFixture({
            start: pastStart1,
            isWalkIn: true,
            status: 'scheduled',
        });

        const idRescheduled = await createAppointmentFixture({
            start: pastStart2,
            isWalkIn: true,
            status: 'rescheduled',
        });

        const affected = await autoCheckInWalkIns(runAt);
        expect(affected).toBeGreaterThanOrEqual(2);

        const row1 = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [idScheduled])).rows[0];
        const row2 = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [idRescheduled])).rows[0];

        expect(row1.status).toBe('checked_in');
        expect(new Date(row1.checked_in_at).toISOString()).toBe(pastStart1.toISOString());

        expect(row2.status).toBe('checked_in');
        expect(new Date(row2.checked_in_at).toISOString()).toBe(pastStart2.toISOString());
    });

    it('ignora citas no walk-in y estados distintos (citas normales no se auto-registran, walk-in cancelado no se toca)', async () => {
        const now = new Date('2026-11-21T12:00:00.000Z');
        const pastStart = new Date(now.getTime() - 10 * MS_PER_MINUTE);

        const regularScheduled = await createAppointmentFixture({
            start: pastStart,
            isWalkIn: false,
            status: 'scheduled',
        });

        const regularRescheduled = await createAppointmentFixture({
            start: pastStart,
            isWalkIn: false,
            status: 'rescheduled',
        });

        const walkInCancelled = await createAppointmentFixture({
            start: pastStart,
            isWalkIn: true,
            status: 'cancelled',
        });

        const walkInCompleted = await createAppointmentFixture({
            start: pastStart,
            isWalkIn: true,
            status: 'completed',
        });

        const priorCheckedInAt = new Date(pastStart.getTime() + 1000);
        const walkInAlreadyCheckedIn = await createAppointmentFixture({
            start: pastStart,
            isWalkIn: true,
            status: 'checked_in',
        });
        await getPool().query('UPDATE appointments SET checked_in_at = $1 WHERE id = $2', [
            priorCheckedInAt,
            walkInAlreadyCheckedIn,
        ]);

        await autoCheckInWalkIns(now);

        const regular1 = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [regularScheduled])).rows[0];
        const regular2 = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [regularRescheduled])).rows[0];
        const cancelled = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [walkInCancelled])).rows[0];
        const completed = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [walkInCompleted])).rows[0];
        const checkedIn = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [walkInAlreadyCheckedIn])).rows[0];

        expect(regular1.status).toBe('scheduled');
        expect(regular1.checked_in_at).toBeNull();

        expect(regular2.status).toBe('rescheduled');
        expect(regular2.checked_in_at).toBeNull();

        expect(cancelled.status).toBe('cancelled');
        expect(completed.status).toBe('completed');

        expect(checkedIn.status).toBe('checked_in');
        expect(new Date(checkedIn.checked_in_at).toISOString()).toBe(priorCheckedInAt.toISOString());
    });

    it('es idempotente: re-ejecutarlo no modifica citas ya procesadas ni produce cambios adicionales', async () => {
        const now = new Date('2026-11-21T13:00:00.000Z');
        const start = new Date(now.getTime() - 10 * MS_PER_MINUTE);

        const id = await createAppointmentFixture({
            start,
            isWalkIn: true,
            status: 'scheduled',
        });

        const firstRun = await autoCheckInWalkIns(now);
        expect(firstRun).toBeGreaterThanOrEqual(1);

        const check1 = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [id])).rows[0];
        expect(check1.status).toBe('checked_in');

        // Segunda corrida con el mismo instante
        const secondRun = await autoCheckInWalkIns(now);
        expect(secondRun).toBe(0);

        // Tercera corrida con un instante posterior
        const later = new Date(now.getTime() + 15 * MS_PER_MINUTE);
        const thirdRun = await autoCheckInWalkIns(later);
        expect(thirdRun).toBe(0);

        const check2 = (await getPool().query('SELECT status, checked_in_at FROM appointments WHERE id = $1', [id])).rows[0];
        expect(check2.status).toBe('checked_in');
        expect(new Date(check2.checked_in_at).toISOString()).toBe(new Date(check1.checked_in_at).toISOString());
    });

    it('un walk-in nunca llega a no_show (ignorado por markNoShow tanto antes como después de su auto check-in)', async () => {
        const now = new Date('2026-11-21T14:00:00.000Z');
        // Inicio hace 20 minutos (más del cutoff de 10 min de no-show)
        const overdueStart = new Date(now.getTime() - 20 * MS_PER_MINUTE);

        const walkInId = await createAppointmentFixture({
            start: overdueStart,
            isWalkIn: true,
            status: 'scheduled',
        });

        // Incluso si markNoShow corriera primero, markAppointmentAsNoShow tiene `is_walk_in = false`
        await markNoShow(now);
        const afterNoShowOnly = (await getPool().query('SELECT status FROM appointments WHERE id = $1', [walkInId])).rows[0];
        expect(afterNoShowOnly.status).toBe('scheduled');

        // Al correr el auto-check-in, pasa a checked_in
        await autoCheckInWalkIns(now);
        const afterAutoCheckIn = (await getPool().query('SELECT status FROM appointments WHERE id = $1', [walkInId])).rows[0];
        expect(afterAutoCheckIn.status).toBe('checked_in');

        // Y en corridas posteriores de markNoShow sigue sin ser tocado
        await markNoShow(new Date(now.getTime() + 5 * MS_PER_MINUTE));
        const afterSecondNoShow = (await getPool().query('SELECT status FROM appointments WHERE id = $1', [walkInId])).rows[0];
        expect(afterSecondNoShow.status).toBe('checked_in');
    });

    it('cadena completa walk-in → checked_in → completed en una sola corrida tras caída del servidor', async () => {
        // Simular que el servidor estuvo caído y se reinicia a las 15:30.
        // El walk-in estaba programado de 14:00 a 14:45. Al momento del reinicio,
        // scheduled_end ya pasó (14:45 < 15:30).
        const restartNow = new Date('2026-11-21T15:30:00.000Z');
        const start = new Date('2026-11-21T14:00:00.000Z');
        const end = new Date('2026-11-21T14:45:00.000Z');

        const walkInId = await createAppointmentFixture({
            start,
            end,
            isWalkIn: true,
            status: 'scheduled',
            clientId,
        });

        // Definimos el job de completar citas según las reglas D4, R-CO-1 y R-CO-2:
        // checked_in con scheduled_end <= now pasa a completed con completed_at = scheduled_end
        const completeJob: Job = {
            name: 'complete-appointments',
            run: async ({ now }) => {
                const result = await getPool().query(
                    `UPDATE appointments
                     SET status = 'completed',
                         completed_at = scheduled_end
                     WHERE status = 'checked_in'
                       AND scheduled_end <= $1`,
                    [now]
                );
                return { affected: result.rowCount ?? 0 };
            },
        };

        const logs: string[] = [];
        const logger = {
            log: (msg: string) => logs.push(msg),
            warn: (msg: string) => logs.push('WARN: ' + msg),
            error: (msg: string, err?: unknown) => logs.push('ERROR: ' + msg + ' ' + String(err)),
            debug: () => {},
        };

        // Creamos el runner con el grupo ordenado: 1) walkInCheckInJob -> 2) completeJob -> 3) noShowJob
        const runner = createJobRunner({
            groups: [
                {
                    name: 'appointment-status',
                    intervalMs: 60_000,
                    lockKey: 252_999,
                    jobs: [walkInCheckInJob, completeJob],
                },
            ],
            getPool,
            clock: () => restartNow,
            logger,
        });

        // En una sola corrida del grupo:
        const outcome = await runner.runGroupOnce('appointment-status', restartNow);
        expect(outcome).toBe('completed');

        // Verificamos logs por corrida
        expect(logs.some((l) => l.includes('appointment-status/auto-check-in-walk-ins: 1 affected'))).toBe(true);
        expect(
            logs.some((l) => l.includes('appointment-status/complete-appointments:') && l.includes('affected'))
        ).toBe(true);

        // Verificamos el estado final en BD
        const finalRow = (
            await getPool().query('SELECT status, checked_in_at, completed_at FROM appointments WHERE id = $1', [walkInId])
        ).rows[0];

        expect(finalRow.status).toBe('completed');
        expect(new Date(finalRow.checked_in_at).toISOString()).toBe(start.toISOString());
        expect(new Date(finalRow.completed_at).toISOString()).toBe(end.toISOString());
    });
});
