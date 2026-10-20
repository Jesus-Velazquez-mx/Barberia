import { Router } from 'express';
import { list, getById, create, update, remove } from '../controllers/serviceCategoryController.js';

const router = Router();

/**
 * @swagger
 * /api/servicesCategories:
 *   get:
 *     summary: Obtiene la lista de categorías de servicios
 *     tags: [Service Categories]
 *     description: Retorna un listado con todas las categorías de servicios disponibles en el catálogo. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de categorías.
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
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       description: { type: string, nullable: true }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *                 message: { type: string, example: Categories retrieved successfully }
 *                 error: { nullable: true, example: null }
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para ver las categorías de servicios.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/servicesCategories', list);

/**
 * @swagger
 * /api/servicesCategories:
 *   post:
 *     summary: Registra una nueva categoría de servicios
 *     tags: [Service Categories]
 *     description: Permite a un manager registrar una categoría para clasificar los servicios ofrecidos. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Cortes de Cabello"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Cortes clásicos, modernos y personalizados"
 *     responses:
 *       201:
 *         description: Categoría de servicios creada con éxito.
 *       400:
 *         description: Error de validación en los campos proporcionados.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para crear categorías.
 *       409:
 *         description: Ya existe una categoría con ese nombre.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/servicesCategories', create);

/**
 * @swagger
 * /api/servicesCategories/{id}:
 *   get:
 *     summary: Obtiene los detalles de una categoría de servicios por ID
 *     tags: [Service Categories]
 *     description: Retorna la información de una categoría específica. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la categoría a consultar.
 *     responses:
 *       200:
 *         description: Categoría encontrada exitosamente.
 *       400:
 *         description: Formato de ID inválido.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para consultar la categoría.
 *       404:
 *         description: Categoría no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/servicesCategories/:id', getById);

/**
 * @swagger
 * /api/servicesCategories/{id}:
 *   put:
 *     summary: Actualiza una categoría de servicios existente
 *     tags: [Service Categories]
 *     description: Permite modificar el nombre y/o descripción de una categoría. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la categoría a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Categoría actualizada con éxito.
 *       400:
 *         description: Datos inválidos o ningún campo proporcionado para actualizar.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para actualizar la categoría.
 *       404:
 *         description: Categoría no encontrada.
 *       409:
 *         description: El nombre especificado ya pertenece a otra categoría.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/servicesCategories/:id', update);

/**
 * @swagger
 * /api/servicesCategories/{id}:
 *   delete:
 *     summary: Elimina (desactiva) una categoría de servicios
 *     tags: [Service Categories]
 *     description: Eliminación lógica. Marca la categoría especificada y todos sus servicios asociados como inactivos (is_active = false), conservando el historial de citas. Es idempotente. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la categoría a eliminar.
 *     responses:
 *       200:
 *         description: Categoría y sus servicios desactivados exitosamente.
 *       400:
 *         description: Formato de ID inválido.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para eliminar la categoría.
 *       404:
 *         description: Categoría no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/servicesCategories/:id', remove);

export default router;
