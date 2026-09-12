import connection from '../connection/connection.js';
import type { Test } from '../types/test.interface.js';
/* Capa de datos: encapsula el acceso a la tabla TEST. No conoce Express ni reglas de negocio */

/* Obtenemos el pool de conexiones */
const { getPool } = connection;

/* Obtiene todas las filas de la tabla TEST */
const findAll = async (): Promise<Test[]> => {
    const pool = getPool();

    const sqlListarTest = 'SELECT * FROM TEST';
    const resultado = await pool.query<Test>(sqlListarTest);

    return resultado.rows;
};

/* Inserta un nuevo registro en la tabla TEST */
const create = async (idTest: number, fieldTest: string): Promise<number | null> => { // rowCount es del tipo number | null
    const pool = getPool();

    const sqlCrearTest = 'INSERT INTO TEST (id_test, field_test) VALUES ($1, $2)';
    const resultado = await pool.query(sqlCrearTest, [idTest, fieldTest]);

    return resultado.rowCount;
};

/* Actualiza el field_test de un registro existente */
const update = async (idTest: number, fieldTest: string): Promise<number | null> => {
    const pool = getPool();

    const sqlEditarTest = 'UPDATE TEST SET field_test = $1 WHERE id_test = $2';
    const resultado = await pool.query(sqlEditarTest, [fieldTest, idTest]);

    return resultado.rowCount;
};

/* Elimina un registro de la tabla TEST */
const remove = async (idTest: number): Promise<number | null> => {
    const pool = getPool();

    const sqlEliminarTest = 'DELETE FROM TEST WHERE id_test = $1';
    const resultado = await pool.query(sqlEliminarTest, [idTest]);

    return resultado.rowCount;
};

export default { findAll, create, update, remove };
