import connection from '../connection/connection.js';
import { createJobRunner, type JobRunner } from './jobRunner.js';
import { walkInCheckInJob } from './walkInCheckInJob.js';
import { noShowJob } from './noShowJob.js';
import { reminderJob } from './reminderJob.js';
import type { JobGroup } from './types.js';

/** Claves de `pg_try_advisory_lock`, una por grupo. No reutilizar ni cambiar sin coordinar despliegues. */
export const JOB_LOCK_KEYS = {
    appointmentStatus: 252_001,
    appointmentReminders: 252_002,
} as const;

export interface JobsConfig {
    JOBS_INTERVAL_MS: number;
    REMINDERS_JOB_INTERVAL_MS: number;
}

export const buildJobGroups = (config: JobsConfig): JobGroup[] => [
    {
        name: 'appointment-status',
        intervalMs: config.JOBS_INTERVAL_MS,
        lockKey: JOB_LOCK_KEYS.appointmentStatus,
        /*
         * El orden es obligatorio (R-WI-7): tras una caída del servidor, un walk-in cuyo scheduled_end ya
         * pasó debe quedar checked_in y luego completed en la misma corrida.
         *   1) auto check-in de walk-ins  (#258)
         *   2) completar citas            (#253)
         *   3) marcar no-show             (#254)
         * Cada job debe ser un UPDATE atómico e idempotente que use `ctx.now` (no `now()` de SQL).
         */
        jobs: [walkInCheckInJob, noShowJob],
    },
    {
        name: 'appointment-reminders',
        intervalMs: config.REMINDERS_JOB_INTERVAL_MS,
        lockKey: JOB_LOCK_KEYS.appointmentReminders,
        jobs: [reminderJob],
    },
];

export const createAppJobRunner = (config: JobsConfig): JobRunner =>
    createJobRunner({ groups: buildJobGroups(config), getPool: connection.getPool });
