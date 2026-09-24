//import type { Request, Response } from 'express';
import testService from '../services/testService.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendFail, sendInternalServerError} from '../utils/apiResponse.js';
import type { Test } from '../types/entities/test.interface.js';


/* Esto es una prueba. En el proyecto real, los datos se validarán con Zod */

/* Capa de controlador: sólo maneja req/res y delega la lógica al servicio */

/* Función para listar test */
const listarTest: ApiHandler<Test[]> = async (req, res) => {
    try {
        const resultado = await testService.listarTest();

        sendSuccess(res, resultado, 'Test obtenidos correctamente', 200);
    } catch (err) {
        sendInternalServerError(res, [String(err)]);
    }
};

/* Función para crear test */
const crearTest: ApiHandler<number> = async (req, res) => {
    try {
        /* Sacar los datos del cuerpo de la solicitud */
        const { id_test, field_test } = req.body;

        const rowCount = await testService.crearTest(id_test, field_test);

        /* rowCount regresa el número de filas afectadas */
        sendSuccess(res, rowCount ?? 0 , 'Test creado correctamente', 201);
    } catch (err) {
        sendInternalServerError(res, [String(err)]);
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

        sendSuccess(res, { id_test, field_test }, 'Test actualizado correctamente', 200);
    } catch (err) {
        sendInternalServerError(res, [String(err)]);
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

        sendSuccess(res, rowCount ?? 0, 'Test eliminado correctamente', 200);
    } catch (err) {
        sendInternalServerError(res, [String(err)]);
    }
};

export default { listarTest, crearTest, editarTest, eliminarTest };
