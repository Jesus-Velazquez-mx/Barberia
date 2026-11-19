import type { Pool } from 'pg';

export type LockablePool = Pick<Pool, 'connect'>;

/**
 * Ejecuta `fn` solo si esta instancia obtiene el advisory lock de sesión `key`; si otra instancia ya lo
 * tiene, no ejecuta nada y devuelve `{ acquired: false }`.
 *
 * El lock se toma en una conexión dedicada que se mantiene durante toda la corrida y se libera al final.
 * Si la conexión se cae, Postgres libera el lock automáticamente, así que una instancia caída nunca deja
 * el grupo bloqueado.
 */
export const withAdvisoryLock = async <T>(
    pool: LockablePool,
    key: number,
    fn: () => Promise<T>
): Promise<{ acquired: false } | { acquired: true; value: T }> => {
    const client = await pool.connect();
    let acquired = false;
    try {
        const result = await client.query<{ locked: boolean }>('SELECT pg_try_advisory_lock($1) AS locked', [key]);
        acquired = result.rows[0]?.locked === true;
        if (!acquired) {
            return { acquired: false };
        }
        const value = await fn();
        return { acquired: true, value };
    } finally {
        if (acquired) {
            try {
                await client.query('SELECT pg_advisory_unlock($1)', [key]);
            } catch (error) {
                console.error(`[jobs] Could not release advisory lock ${key}:`, error);
            }
        }
        client.release();
    }
};
