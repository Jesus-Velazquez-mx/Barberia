import sql from 'mssql';
import 'dotenv/config';

/* Configuración de la conexión */
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
    server: 'localhost',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
}

/* Aquí se guardará el pool de conexiones */
let pool;

/* Función para conectar con la base de datos*/
const connectDB = async () => {
    try {
        pool = await sql.connect(sqlConfig); // Crea el pool
        console.log('Conectado a SQL Server');
        return pool;
    } catch (err) {
        console.error('Error al conectar con la base de datos:', err);
        throw err;
    }
}

/* Función para obtener el pool de conexiones */
const getPool = () => {
    if (!pool)
        throw new Error('No hay conexiones abiertas con la base de datos.')
    return pool;
}

/* Función para cerrar la conexión con la base de datos */
const closeDB = async () => {
    if (pool) {
        await pool.close();
        console.log('Conexión a SQL Server cerrada');
    }
}

export default { connectDB, getPool, closeDB };