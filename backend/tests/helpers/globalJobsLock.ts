import connection from '../../src/connection/connection.js';

const { getPool } = connection;

/** Clave propia de las pruebas: no coincide con JOB_LOCK_KEYS ni con las lockKey que los tests pasan al runner. */
const GLOBAL_JOBS_TEST_LOCK_KEY = 252_900;

/** Timeout para el beforeAll que toma el candado: incluye la espera a que termine el otro archivo. */
export const GLOBAL_JOBS_LOCK_TIMEOUT_MS = 60_000;

/**
 * Serializa los archivos de prueba que corren los jobs de estado de citas.
 *
 * Esos jobs hacen UPDATE sobre toda la tabla `appointments`, sin filtrar por sucursal ni cliente, y Jest corre
 * los archivos en paralelo contra la misma base: sin este candado, el job de un archivo cambia las citas de otro
 * a media prueba. Todo archivo que corra uno de estos jobs y confirme los cambios debe llamarla en `beforeAll`
 * y liberar el candado en `afterAll`, después de borrar sus citas. (Si los cambios se revierten, como en
 * appointmentCheckIn.test.ts, no hace falta.)
 *
 * El candado es de sesión y vive en una conexión dedicada, así que requiere el pool ya conectado y hay que
 * liberarlo antes de `closeDB`. Si el worker muere, Postgres lo libera al cerrarse la conexión.
 */
export const acquireGlobalJobsLock = async (): Promise<() => Promise<void>> => {
    const client = await getPool().connect();
    await client.query('SELECT pg_advisory_lock($1)', [GLOBAL_JOBS_TEST_LOCK_KEY]);

    return async () => {
        try {
            await client.query('SELECT pg_advisory_unlock($1)', [GLOBAL_JOBS_TEST_LOCK_KEY]);
        } finally {
            client.release();
        }
    };
};
