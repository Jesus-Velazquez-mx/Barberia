import type { Request, Response } from 'express';
import testService from '../services/testService.js';

/* Esto es una prueba. En el proyecto real, los datos se validarán con Zod */

/* Capa de controlador: sólo maneja req/res y delega la lógica al servicio */

/* Función para listar test */
const listarTest = async (req: Request, res: Response) => {
    try {
        const resultado = await testService.listarTest();

        res.status(200).json(resultado);
    } catch (err) {
        console.error('Error al listar test:', err);
        res.status(500).json({ error: 'Error al listar test' });
    }
}

/* Función para crear test */
const crearTest = async (req: Request, res: Response) => {
    try {
        /* Sacar los datos del cuerpo de la solicitud */
        const { id_test, field_test } = req.body;

        const rowCount = await testService.crearTest(id_test, field_test);

        /* rowCount regresa el número de filas afectadas */
        res.status(201).json({ 'Test creado': rowCount });
    } catch (err) {
        console.error('Error al crear test:', err);
        res.status(500).json({ error: 'Error al crear test' });
    }
}

/* Función para editar test*/
const editarTest = async (req: Request, res: Response) => {
    try {
        const { id_test, field_test } = req.body;

        const rowCount = await testService.editarTest(id_test, field_test);

        res.status(200).json({ 'Test actualizado': rowCount });
    } catch (err) {
        console.error('Error al editar test:', err);
        res.status(500).json({ error: 'Error al editar test' });
    }
}

/* Función para eliminar test */
const eliminarTest = async (req: Request, res: Response) => {
    try {
        const { id_test } = req.body;

        const rowCount = await testService.eliminarTest(id_test);

        res.status(200).json({ 'Test eliminado': rowCount });
    } catch (err) {
        console.error('Error al eliminar test:', err);
        res.status(500).json({ error: 'Error al eliminar test' });
    }
}


export default { listarTest, crearTest, editarTest, eliminarTest };
