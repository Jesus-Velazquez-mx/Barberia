import { jest } from '@jest/globals';
import connection from '../src/connection/connection.js';
import { createJobRunner } from '../src/jobs/jobRunner.js';
import type { LockablePool } from '../src/jobs/advisoryLock.js';
import type { Job, JobContext, JobGroup } from '../src/jobs/types.js';

const silentLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

/* Pool falso: `locked` decide si pg_try_advisory_lock se concede. */
const createFakePool = (locked = true) => {
    const queries: string[] = [];
    const release = jest.fn();
    const pool = {
        connect: jest.fn(async () => ({
            query: async (sql: string) => {
                queries.push(sql);
                return { rows: [{ locked }] };
            },
            release,
        })),
    } as unknown as LockablePool;
    return { pool, queries, release };
};

const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    return { promise, resolve };
};

const group = (overrides: Partial<JobGroup> = {}): JobGroup => ({
    name: 'test-group',
    intervalMs: 1_000,
    lockKey: 1,
    jobs: [],
    ...overrides,
});

describe('createJobRunner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('runs the jobs of a group in order, all with the same injected now', async () => {
        const now = new Date('2026-11-18T12:00:00Z');
        const calls: Array<{ name: string; ctx: JobContext }> = [];
        const job = (name: string): Job => ({
            name,
            run: async (ctx) => {
                calls.push({ name, ctx });
                return { affected: 1 };
            },
        });
        const { pool } = createFakePool();
        const runner = createJobRunner({
            groups: [group({ jobs: [job('walk-in'), job('complete'), job('no-show')] })],
            getPool: () => pool,
            clock: () => now,
            logger: silentLogger,
        });

        await expect(runner.runGroupOnce('test-group')).resolves.toBe('completed');

        expect(calls.map((c) => c.name)).toEqual(['walk-in', 'complete', 'no-show']);
        expect(calls.every((c) => c.ctx.now === now)).toBe(true);
        expect(silentLogger.log).toHaveBeenCalledWith(expect.stringContaining('test-group/complete: 1 affected'));
    });

    it('logs a failing job and keeps running the following ones', async () => {
        const after = jest.fn(async () => undefined);
        const { pool } = createFakePool();
        const runner = createJobRunner({
            groups: [
                group({
                    jobs: [
                        {
                            name: 'boom',
                            run: async () => {
                                throw new Error('boom');
                            },
                        },
                        { name: 'after', run: after },
                    ],
                }),
            ],
            getPool: () => pool,
            logger: silentLogger,
        });

        await expect(runner.runGroupOnce('test-group')).resolves.toBe('completed');

        expect(after).toHaveBeenCalledTimes(1);
        expect(silentLogger.error).toHaveBeenCalledWith('[jobs] test-group/boom failed:', expect.any(Error));
    });

    it('skips the run without executing jobs when another instance holds the lock', async () => {
        const run = jest.fn(async () => undefined);
        const { pool, queries, release } = createFakePool(false);
        const runner = createJobRunner({
            groups: [group({ jobs: [{ name: 'job', run }] })],
            getPool: () => pool,
            logger: silentLogger,
        });

        await expect(runner.runGroupOnce('test-group')).resolves.toBe('skipped-locked');

        expect(run).not.toHaveBeenCalled();
        expect(queries.some((q) => q.includes('pg_advisory_unlock'))).toBe(false);
        expect(release).toHaveBeenCalledTimes(1);
    });

    it('releases the advisory lock and the connection after a run', async () => {
        const { pool, queries, release } = createFakePool();
        const runner = createJobRunner({
            groups: [group({ jobs: [{ name: 'job', run: async () => undefined }] })],
            getPool: () => pool,
            logger: silentLogger,
        });

        await runner.runGroupOnce('test-group');

        expect(queries).toEqual([
            expect.stringContaining('pg_try_advisory_lock'),
            expect.stringContaining('pg_advisory_unlock'),
        ]);
        expect(release).toHaveBeenCalledTimes(1);
    });

    it('does not take a connection for a group without jobs', async () => {
        const { pool } = createFakePool();
        const runner = createJobRunner({ groups: [group()], getPool: () => pool, logger: silentLogger });

        await expect(runner.runGroupOnce('test-group')).resolves.toBe('skipped-empty');
        expect(pool.connect).not.toHaveBeenCalled();
    });

    it('runs immediately on start, then periodically at the configured interval without overlapping runs', async () => {
        jest.useFakeTimers();
        const gate = deferred();
        let concurrent = 0;
        let maxConcurrent = 0;
        let runs = 0;
        const slowJob: Job = {
            name: 'slow',
            run: async () => {
                runs++;
                concurrent++;
                maxConcurrent = Math.max(maxConcurrent, concurrent);
                if (runs === 1) await gate.promise;
                concurrent--;
            },
        };
        const { pool } = createFakePool();
        const runner = createJobRunner({
            groups: [group({ intervalMs: 1_000, jobs: [slowJob] })],
            getPool: () => pool,
            logger: silentLogger,
        });

        /* La primera corrida es inmediata, sin esperar el intervalo */
        runner.start();
        await jest.advanceTimersByTimeAsync(0);
        expect(runs).toBe(1);

        /* La primera corrida sigue en curso: avanzar el reloj no debe disparar otra */
        await jest.advanceTimersByTimeAsync(5_000);
        expect(runs).toBe(1);

        /* Al terminar, la siguiente se programa tras el intervalo completo (fixed delay) */
        gate.resolve();
        await jest.advanceTimersByTimeAsync(999);
        expect(runs).toBe(1);

        await jest.advanceTimersByTimeAsync(1);
        expect(runs).toBe(2);
        expect(maxConcurrent).toBe(1);

        await runner.stop();
        expect(jest.getTimerCount()).toBe(0);
    });

    it('stop() waits for the in-flight run and schedules nothing afterwards', async () => {
        jest.useFakeTimers();
        const gate = deferred();
        const run = jest.fn(async () => {
            await gate.promise;
        });
        const { pool } = createFakePool();
        const runner = createJobRunner({
            groups: [group({ intervalMs: 1_000, jobs: [{ name: 'job', run }] })],
            getPool: () => pool,
            logger: silentLogger,
        });

        runner.start();
        await jest.advanceTimersByTimeAsync(0);
        expect(run).toHaveBeenCalledTimes(1);

        let stopped = false;
        const stopping = runner.stop().then(() => {
            stopped = true;
        });
        await jest.advanceTimersByTimeAsync(0);
        expect(stopped).toBe(false);

        gate.resolve();
        await stopping;
        expect(stopped).toBe(true);
        expect(jest.getTimerCount()).toBe(0);

        await jest.advanceTimersByTimeAsync(10_000);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('rejects invalid configurations', () => {
        const { pool } = createFakePool();
        const getPool = () => pool;
        expect(() => createJobRunner({ groups: [group(), group()], getPool })).toThrow(/names must be unique/);
        expect(() => createJobRunner({ groups: [group(), group({ name: 'other' })], getPool })).toThrow(
            /lock keys must be unique/
        );
        expect(() => createJobRunner({ groups: [group({ intervalMs: 0 })], getPool })).toThrow(/intervalMs/);
    });
});

describe('createJobRunner with a real database (multi-instance safety)', () => {
    const { connectDB, closeDB, getPool } = connection;

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await closeDB();
    });

    it('only one of two concurrent runners executes a group sharing the same lock key', async () => {
        const gate = deferred();
        let entered = 0;
        const makeRunner = () =>
            createJobRunner({
                groups: [
                    group({
                        lockKey: 999_252,
                        jobs: [
                            {
                                name: 'slow',
                                run: async () => {
                                    entered++;
                                    await gate.promise;
                                },
                            },
                        ],
                    }),
                ],
                getPool,
                logger: silentLogger,
            });

        const first = makeRunner().runGroupOnce('test-group');
        /* Esperar a que la primera instancia tenga el lock antes de lanzar la segunda */
        while (entered === 0) await new Promise((r) => setTimeout(r, 10));
        const second = await makeRunner().runGroupOnce('test-group');

        gate.resolve();
        expect(await first).toBe('completed');
        expect(second).toBe('skipped-locked');
        expect(entered).toBe(1);

        /* Liberado el lock, una nueva corrida sí se ejecuta */
        await expect(makeRunner().runGroupOnce('test-group')).resolves.toBe('completed');
        expect(entered).toBe(2);
    });
});
