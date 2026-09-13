//import type { Request, Response } from 'express';
import testService from '../services/testService.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendFail} from '../utils/apiResponse.js';
import type { Test } from '../types/test.interface.js';


/* Esto es una prueba. En el proyecto real, los datos se validarán con Zod */

/* Capa de controlador: sólo maneja req/res y delega la lógica al servicio */

/* Función para listar test */
const listarTest: ApiHandler<Test[]> = async (req, res) => {
    try {
        const resultado = await testService.listarTest();

        //res.status(200).json(resultado);
        sendSuccess(res, resultado, 'Test obtenidos correctamente', 200);
    } catch (err) {
        console.error('Error al listar test:', err);
        //res.status(500).json({ error: 'Error al listar test' });
        sendFail(res, 'Error al listar test', [String(err)], 500);
    }
};

/* Función para crear test */
const crearTest: ApiHandler<number> = async (req, res) => {
    try {
        /* Sacar los datos del cuerpo de la solicitud */
        const { id_test, field_test } = req.body;

        const rowCount = await testService.crearTest(id_test, field_test);

        /* rowCount regresa el número de filas afectadas */
        //res.status(201).json({ 'Test creado': rowCount });
        sendSuccess(res, rowCount ?? 0 , 'Test creado correctamente', 201);
    } catch (err) {
        console.error('Error al crear test:', err);
        //res.status(500).json({ error: 'Error al crear test' });
        sendFail(res, 'Error al crear test', [String(err)], 500);
    }
};

/* Función para editar test*/
const editarTest: ApiHandler<Test> = async (req, res) => {
    try {
        const { id_test, field_test } = req.body;

        const rowCount = await testService.editarTest(id_test, field_test);
        if (!rowCount) {
            throw new Error(`No existe un test con id_test=${id_test}`);
        }

        //res.status(200).json({ 'Test actualizado': rowCount });
        sendSuccess(res, { id_test, field_test }, 'Test actualizado correctamente', 200);
    } catch (err) {
        console.error('Error al editar test:', err);
        //res.status(500).json({ error: 'Error al editar test' });
        sendFail(res, 'Error al editar test', [String(err)], 500);
    }
};

/* Función para eliminar test */
const eliminarTest: ApiHandler<number> = async (req, res) => {
    try {
        const { id_test } = req.body;

        const rowCount = await testService.eliminarTest(id_test);
        if (!rowCount) {
            throw new Error(`No existe un test con id_test=${id_test}`);
        }

        //res.status(200).json({ 'Test eliminado': rowCount });
        sendSuccess(res, rowCount ?? 0, 'Test eliminado correctamente', 200);
    } catch (err) {
        console.error('Error al eliminar test:', err);
        //res.status(500).json({ error: 'Error al eliminar test' });
        sendFail(res, 'Error al eliminar test', [String(err)], 500);
    }
};

export default { listarTest, crearTest, editarTest, eliminarTest };
