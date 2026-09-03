import { Router } from 'express';
import userController from '../controllers/userController.js';

/* Iniciamos el router*/
const router = Router();

/* Sacamos todas las funciones*/
const { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } = userController;

/* Para documentar APIs se usa swagger-jsdoc */

/**
 * @swagger
 * /api/listarUsuarios:
 *   get:
 *     summary: Obtiene la lista completa de usuarios
 *     description: Retorna un arreglo JSON con todos los usuarios registrados en SQL Server.
 *     responses:
 *       200:
 *         description: Éxito. Devuelve el arreglo de usuarios.
 *       500:
 *         description: Error interno de la base de datos.
 */
router.get('/listarUsuarios', listarUsuarios);

/**
 * @swagger
 * /api/crearUsuario:
 *   post:
 *     summary: Crea un nuevo usuario
 *     description: Permite crear un nuevo usuario en la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Éxito. Devuelve el arreglo de usuarios.
 *       500:
 *         description: Error interno de la base de datos.
 */
router.post('/crearUsuario', crearUsuario);

/**
 * @swagger
 * /api/actualizarUsuario:
 *   put:
 *     summary: Actualiza un usuario existente
 *     description: Permite actualizar la información de un usuario en la base de datos.
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
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Éxito. Devuelve el usuario cambiado.
 *       500:
 *         description: Error interno de la base de datos.
 */
router.put('/actualizarUsuario', actualizarUsuario);

/**
 * @swagger
 * /api/eliminarUsuario:
 *   delete:
 *     summary: Elimina un usuario existente
 *     description: Permite eliminar un usuario de la base de datos.
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
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Éxito. Devuelve el usuario eliminado.
 *       500:
 *         description: Error interno de la base de datos.
 */
router.delete('/eliminarUsuario', eliminarUsuario);

export default router;
