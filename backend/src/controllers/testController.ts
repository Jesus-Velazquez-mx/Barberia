//import type { Request, Response } from 'express';
import testService from '../services/testService.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendFail, sendInternalServerError } from '../utils/apiResponse.js';
import type { Test } from '../types/entities/test.interface.js';


/* Esto es una prueba. En el proyecto real, los datos se validarán con Zod */

/* Capa de controlador: sólo maneja req/res y delega la lógica al servicio */

/* Función para listar test */
const listarTest: ApiHandler<Test[]> = async (req, res) => {
    try {
        const resultado = await testService.listarTest();

        sendSuccess({ res: res, data: resultado, message: 'Test obtenidos correctamente' });
    } catch (err) {
        sendInternalServerError({res, error: [String(err)]});
    }
};

/* Función para crear test */
const crearTest: ApiHandler<number> = async (req, res) => {
    try {
        /* Sacar los datos del cuerpo de la solicitud */
        const { id_test, field_test } = req.body;

        const rowCount = await testService.crearTest(id_test, field_test);

        /* rowCount regresa el número de filas afectadas */
        sendSuccess({ res: res, data: rowCount ?? 0, message: 'Test creado correctamente', status: 201 });
    } catch (err) {
        sendInternalServerError({res, error: [String(err)]});
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

        sendSuccess({ res: res, data: { id_test, field_test }, message: 'Test actualizado correctamente' });
    } catch (err) {
        sendInternalServerError({res, error: [String(err)]});
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

        sendSuccess({ res: res, data: rowCount ?? 0, message: 'Test eliminado correctamente' });
    } catch (err) {
        sendInternalServerError({res, error: [String(err)]});
    }
};

export default { listarTest, crearTest, editarTest, eliminarTest };
