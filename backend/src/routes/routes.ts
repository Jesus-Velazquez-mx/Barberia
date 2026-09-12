import { Router } from 'express';
import testController from '../controllers/testController.js';
import recommendationController from '../controllers/recommendationController.js';

/* Iniciamos el router*/
const router = Router();

/* Sacamos todas las funciones*/
const { listarTest, crearTest, editarTest, eliminarTest } = testController;
const { testAiService } = recommendationController;

/* Para documentar APIs se usa swagger-jsdoc */

/**
 * @swagger
 * /api/listarTests:
 *   get:
 *     summary: Obtiene la lista completa de tests
 *     description: Retorna un arreglo JSON con todos los tests registrados en SQL Server.
 *     responses:
 *       200:
 *         description: Éxito. Devuelve el arreglo de tests.
 *       500:
 *         description: Error interno de la base de datos.
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
 *               id_test:
 *                 type: integer
 *               field_test:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Éxito. Devuelve el arreglo de tests.
 *       500:
 *         description: Error interno de la base de datos.
 */
router.post('/crearTest', crearTest);

/**
 * @swagger
 * /api/actualizarTest:
 *   put:
 *     summary: Actualiza un test existente
 *     description: Permite actualizar la información de un test en la base de datos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_test:
 *                 type: integer
 *               field_test:
 *                 type: string
 *     responses:
 *       200:
 *         description: Éxito. Devuelve el test cambiado.
 *       500:
 *         description: Error interno de la base de datos.
 */
router.put('/actualizarTest', editarTest);

/**
 * @swagger
 * /api/eliminarTest:
 *   delete:
 *     summary: Elimina un test existente
 *     description: Permite eliminar un test de la base de datos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_test:
 *                 type: integer
 *               field_test:
 *                 type: string
 *     responses:
 *       200:
 *         description: Éxito. Devuelve el test eliminado.
 *       500:
 *         description: Error interno de la base de datos.
 */
router.delete('/eliminarTest', eliminarTest);

router.get('/recommendation/test', testAiService)

export default router;
