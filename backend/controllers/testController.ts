import type { Request, Response } from 'express';
import connection from '../connection/connection.js';

/* Esto es una prueba. En el proyecto real, los datos se validarán con Zod */

/* Obtenemos el pool de conexiones */
const { getPool } = connection;

/* Función para listar test */
const listarTest = async (req: Request, res: Response): Promise<void> => {
    try {
        /* Obtenemos el pool de conexiones */
        const pool = getPool();

        /* Query */
        const sqlListarTest = 'SELECT * FROM TEST';
        /* Para correr con query se usa pool.query */
        const resultado = await pool.query(sqlListarTest);

        /* El resultado se encuentra en resultado.rows */
        res.status(200).json(resultado.rows);
    } catch (err) {
        console.error('Error al listar test:', err);
        res.status(500).json({ error: 'Error al listar test' });
    }
}

/* Función para crear test */
const crearTest = async (req: Request, res: Response): Promise<void> => {
    try {
        const pool = getPool();

        /* Sacar los datos del cuerpo de la solicitud */
        const { id_test, field_test } = req.body;

        /* Se usa #N*/
        const sqlCrearTest = 'INSERT INTO TEST (id_test, field_test) VALUES ($1, $2)';
        const resultado = await pool.query(sqlCrearTest, [id_test, field_test]);

        /* rowCount regresa el número de filas afectadas */
        res.status(201).json({ 'Test creado': resultado.rowCount });
    } catch (err) {
        console.error('Error al crear test:', err);
        res.status(500).json({ error: 'Error al crear test' });
    }
}

/* Función para editar test*/
const editarTest = async (req: Request, res: Response): Promise<void> => {
    try {
        const pool = getPool();

        const { id_test, field_test } = req.body;

        const sqlEditarTest = 'UPDATE TEST SET field_test = $1 WHERE id_test = $2';
        const resultado = await pool.query(sqlEditarTest, [field_test, id_test]);

        res.status(200).json({ 'Test actualizado': resultado.rowCount });
    } catch (err) {
        console.error('Error al editar test:', err);
        res.status(500).json({ error: 'Error al editar test' });
    }
}

/* Función para eliminar test */
const eliminarTest = async (req: Request, res: Response): Promise<void> => {
    try {
        const pool = getPool();

        const { id_test } = req.body;

        const sqlEliminarTest = 'DELETE FROM TEST WHERE id_test = $1';
        const resultado = await pool.query(sqlEliminarTest, [id_test]);

        res.status(200).json({ 'Test eliminado': resultado.rowCount });
    } catch (err) {
        console.error('Error al eliminar test:', err);
        res.status(500).json({ error: 'Error al eliminar test' });
    }
}


export default { listarTest, crearTest, editarTest, eliminarTest };
