import { Router } from 'express';
import testController from '../controllers/testController.js';

const router = Router();

const { listarTest, crearTest, editarTest, eliminarTest } = testController;

/* Para documentar APIs se usa swagger-jsdoc */

/**
 * @swagger
 * /api/listarTests:
 *   get:
 *     summary: Obtiene la lista completa de tests
 *     description: Retorna el envelope estándar con un arreglo de tests en `data`.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de tests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_test: { type: integer, example: 1 }
 *                       field_test: { type: string, example: demo }
 *                 message: { type: string, example: Test obtenidos correctamente }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       500:
 *         description: Error interno de la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Error al listar test }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.get('/listarTests', listarTest);

/**
 * @swagger
 * /api/crearTest:
 *   post:
 *     summary: Crea un nuevo test
 *     description: Permite crear un nuevo test en la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_test: { type: integer }
 *               field_test: { type: string }
 *     responses:
 *       201:
 *         description: Éxito. `data` contiene el número de filas afectadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: integer, example: 1 }
 *                 message: { type: string, example: Test creado correctamente }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       500:
 *         description: Error interno de la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Error al crear test }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.post('/crearTest', crearTest);

/**
 * @swagger
 * /api/actualizarTest:
 *   put:
 *     summary: Actualiza un test existente
 *     description: Permite actualizar la información de un test en la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_test: { type: integer }
 *               field_test: { type: string }
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el test actualizado y el número de filas afectadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_test: { type: integer, example: 1 }
 *                     field_test: { type: string, example: demo }
 *                     rowCount: { type: integer, nullable: true, example: 1 }
 *                 message: { type: string, example: Test actualizado correctamente }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       500:
 *         description: Error interno de la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Error al editar test }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.put('/actualizarTest', editarTest);

/**
 * @swagger
 * /api/eliminarTest:
 *   delete:
 *     summary: Elimina un test existente
 *     description: Permite eliminar un test de la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_test: { type: integer }
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el número de filas afectadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: integer, example: 1 }
 *                 message: { type: string, example: Test eliminado correctamente }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       500:
 *         description: Error interno de la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Error al eliminar test }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.delete('/eliminarTest', eliminarTest);

export default router;
