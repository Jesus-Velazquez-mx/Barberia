import { withAdvisoryLock, type LockablePool } from './advisoryLock.js';
import type { JobGroup } from './types.js';

type Logger = Pick<Console, 'log' | 'warn' | 'error' | 'debug'>;

export interface JobRunnerOptions {
    groups: JobGroup[];
    getPool: () => LockablePool;
    /** Reloj inyectable; se invoca una vez al inicio de cada corrida de grupo. */
    clock?: () => Date;
    logger?: Logger;
}

export type GroupRunOutcome = 'completed' | 'skipped-locked' | 'skipped-empty' | 'skipped-running' | 'failed';

export interface JobRunner {
    /**
     * Ejecuta de inmediato la primera corrida de cada grupo y, al terminar cada una, programa la siguiente
     * tras su intervalo. Llamarlo dos veces no tiene efecto.
     */
    start(): void;
    /** Cancela las corridas pendientes y espera a que terminen las que están en curso. */
    stop(): Promise<void>;
    /** Ejecuta un grupo una sola vez (sin programar la siguiente). Útil para tests y arranque manual. */
    runGroupOnce(name: string, now?: Date): Promise<GroupRunOutcome>;
}

/**
 * Runner mínimo de jobs periódicos en proceso.
 *
 * - Programación con cadena de `setTimeout` (fixed delay): la siguiente corrida de un grupo se programa
 *   cuando termina la actual, así que un grupo nunca se solapa consigo mismo.
 * - Seguridad multi-instancia: cada corrida de grupo se hace bajo `pg_try_advisory_lock(group.lockKey)`;
 *   si otra instancia lo tiene, esta corrida se omite. Se eligió advisory lock (en vez de
 *   `FOR UPDATE SKIP LOCKED`) porque cubre también jobs con efectos externos, como el envío de
 *   recordatorios por Telegram, que un `UPDATE` con `SKIP LOCKED` no protegería.
 * - Aislamiento de errores: un job que lanza se registra y los demás jobs del grupo continúan; el grupo
 *   se reprograma siempre.
 */
export const createJobRunner = ({
    groups,
    getPool,
    clock = () => new Date(),
    logger = console,
}: JobRunnerOptions): JobRunner => {
    const groupsByName = new Map(groups.map((group) => [group.name, group]));
    if (groupsByName.size !== groups.length) {
        throw new Error('Job group names must be unique');
    }
    if (new Set(groups.map((group) => group.lockKey)).size !== groups.length) {
        throw new Error('Job group lock keys must be unique');
    }
    for (const group of groups) {
        if (!Number.isInteger(group.intervalMs) || group.intervalMs <= 0) {
            throw new Error(`Job group "${group.name}" must have a positive integer intervalMs`);
        }
    }

    const timers = new Map<string, NodeJS.Timeout>();
    const inFlight = new Map<string, Promise<GroupRunOutcome>>();
    let started = false;
    let stopped = false;

    const executeGroup = async (group: JobGroup, now: Date): Promise<GroupRunOutcome> => {
        if (group.jobs.length === 0) return 'skipped-empty';

        const lock = await withAdvisoryLock(getPool(), group.lockKey, async () => {
            for (const job of group.jobs) {
                const startedAt = Date.now();
                try {
                    const result = await job.run({ now });
                    const summary = result?.affected === undefined ? 'ok' : `${result.affected} affected`;
                    logger.log(`[jobs] ${group.name}/${job.name}: ${summary} (${Date.now() - startedAt}ms)`);
                } catch (error) {
                    logger.error(`[jobs] ${group.name}/${job.name} failed:`, error);
                }
            }
        });

        if (!lock.acquired) {
            logger.debug(`[jobs] ${group.name}: lock held by another instance, skipping run`);
            return 'skipped-locked';
        }
        return 'completed';
    };

    const runGroup = (group: JobGroup, now: Date): Promise<GroupRunOutcome> => {
        if (inFlight.has(group.name)) return Promise.resolve('skipped-running');

        const run = executeGroup(group, now)
            .catch((error: unknown): GroupRunOutcome => {
                logger.error(`[jobs] ${group.name} run failed:`, error);
                return 'failed';
            })
            .finally(() => {
                inFlight.delete(group.name);
            });
        inFlight.set(group.name, run);
        return run;
    };

    /* Ejecuta el grupo y, al terminar, programa la siguiente corrida tras su intervalo (fixed delay) */
    const runAndSchedule = (group: JobGroup) => {
        void runGroup(group, clock()).finally(() => schedule(group));
    };

    const schedule = (group: JobGroup) => {
        if (stopped) return;
        const timer = setTimeout(() => {
            timers.delete(group.name);
            runAndSchedule(group);
        }, group.intervalMs);
        timer.unref();
        timers.set(group.name, timer);
    };

    return {
        start() {
            if (started || stopped) return;
            started = true;
            /* La primera corrida de cada grupo es inmediata (al arrancar el servidor) */
            for (const group of groups) runAndSchedule(group);
            logger.log(
                `[jobs] Runner started: ${groups.map((g) => `${g.name} (every ${g.intervalMs / 1000}s, ${g.jobs.length} jobs)`).join(', ')}`
            );
        },

        async stop() {
            stopped = true;
            for (const timer of timers.values()) clearTimeout(timer);
            timers.clear();
            await Promise.allSettled(inFlight.values());
            if (started) logger.log('[jobs] Runner stopped');
        },

        runGroupOnce(name, now = clock()) {
            const group = groupsByName.get(name);
            if (!group) return Promise.reject(new Error(`Unknown job group "${name}"`));
            return runGroup(group, now);
        },
    };
};
