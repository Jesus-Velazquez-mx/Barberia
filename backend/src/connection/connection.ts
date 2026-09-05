import 'dotenv/config';
import { Pool, type PoolConfig } from 'pg';
import fs from 'fs';
import AWS from 'aws-sdk';

AWS.config.update({ region: 'us-east-2' });

/* Configuración de la conexión leyendo los secretos de GitHub */
const dbConfig: PoolConfig = {
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

// SSL es requerido para cualquier environment, excepto local
if (process.env.ENV != "local") {
    dbConfig.ssl = {
        rejectUnauthorized: false,
        ca: fs.readFileSync('./global-bundle.pem').toString()
    }
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
}

/* Función para cerrar la conexión con la base de datos */
const closeDB = async (): Promise<void> => {
    if (pool) {
        await pool.end();
        console.log('Conexión a PostgreSQL cerrada');
    }
}

export default { connectDB, getPool, closeDB };