import 'dotenv/config';
import { Pool, types, type PoolConfig } from 'pg';
import fs from 'fs';
import { RDSClient } from '@aws-sdk/client-rds';

/* A diferencia de v2, en el SDK v3 no existe un config global (AWS.config.update):
cada cliente se configura por separado al crearlo */
const rdsClient = new RDSClient({ region: 'us-east-2' });

/* Por defecto, node-postgres devuelve NUMERIC/DECIMAL (OID 1700) como string para no
perder precisión. Los tipos de dominio (Service.price, etc.) lo declaran como number,
así que lo parseamos aquí para que el runtime coincida con esos tipos. */
types.setTypeParser(types.builtins.NUMERIC, (value: string) => parseFloat(value));

/* Configuración de la conexión leyendo los secretos de GitHub */
const dbConfig: PoolConfig = {
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
};

// TLS es requerido para cualquier environment, excepto local
if (process.env.ENV != 'local') {
    dbConfig.ssl = {
        rejectUnauthorized: false,
        ca: fs.readFileSync('./global-bundle.pem').toString(),
    };
}

/* Aquí se guardará el pool de conexiones */
let pool: Pool | undefined;

/* Función para conectar con la base de datos */
const connectDB = async (): Promise<Pool> => {
    try {
        pool = new Pool(dbConfig); // Crea el pool de conexiones
        const client = await pool.connect();
        const res = await client.query('SELECT version()');
        console.log('Conectado a PostgreSQL:', res.rows[0].version);
        client.release();
        return pool;
    } catch (err) {
        console.error('Error al conectar con la base de datos:', err);
        throw err;
    }
};

/* Función para obtener el pool de conexiones */
const getPool = (): Pool => {
    if (!pool) {
        throw new Error('No hay conexiones abiertas con la base de datos.');
    }
    return pool;
};

/* Función para cerrar la conexión con la base de datos */
const closeDB = async (): Promise<void> => {
    if (pool) {
        await pool.end();
        console.log('Conexión a PostgreSQL cerrada');
    }
};

export default { connectDB, getPool, closeDB, rdsClient };
