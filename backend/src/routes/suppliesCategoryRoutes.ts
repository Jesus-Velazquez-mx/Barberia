import { Router } from 'express';
import { list, getById, create, update, remove } from '../controllers/suppliesCategoryController.js';

const router = Router();

/**
 * @swagger
 * /api/suppliesCategories:
 *   get:
 *     summary: Obtiene la lista de categorías de insumos
 *     tags: [Supplies Categories]
 *     description: Retorna un listado con todas las categorías de insumos ordenadas alfabéticamente. Endpoint público o accesible para staff.
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
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/suppliesCategories', list);

/**
 * @swagger
 * /api/suppliesCategories:
 *   post:
 *     summary: Registra una nueva categoría de insumos
 *     tags: [Supplies Categories]
 *     description: Permite a un manager o administrador crear una categoría para clasificar los productos del inventario. Requiere token JWT en el header `Authorization`.
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
 *                 example: "Cuidado Facial"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Mascarillas, cremas y exfoliantes"
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente.
 *       400:
 *         description: Error de validación en los campos proporcionados.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: Prohibido. El usuario no tiene rol de manager o su cuenta está desactivada.
 *       409:
 *         description: El nombre de la categoría ya se encuentra en uso.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/suppliesCategories', create);

/**
 * @swagger
 * /api/suppliesCategories/{id}:
 *   get:
 *     summary: Obtiene los detalles de una categoría específica
 *     tags: [Supplies Categories]
 *     description: Recupera la información de una categoría de insumos según su ID. Endpoint público o accesible para staff.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único de la categoría.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene la información de la categoría.
 *       400:
 *         description: Error de validación (el ID no es un UUID válido).
 *       404:
 *         description: Categoría no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/suppliesCategories/:id', getById);

/**
 * @swagger
 * /api/suppliesCategories/{id}:
 *   put:
 *     summary: Edita una categoría de insumos existente
 *     tags: [Supplies Categories]
 *     description: Actualiza el nombre o la descripción de una categoría. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único de la categoría a editar.
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
 *         description: Categoría actualizada correctamente.
 *       400:
 *         description: Error de validación o ningún campo proporcionado.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado.
 *       404:
 *         description: Categoría no encontrada.
 *       409:
 *         description: El nuevo nombre ya pertenece a otra categoría.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/suppliesCategories/:id', update);

/**
 * @swagger
 * /api/suppliesCategories/{id}:
 *   delete:
 *     summary: Elimina una categoría de insumos
 *     tags: [Supplies Categories]
 *     description: Realiza un borrado físico de la categoría en la base de datos. Si la categoría ya está asignada a insumos existentes, la operación será bloqueada por integridad referencial. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único de la categoría a eliminar.
 *     responses:
 *       200:
 *         description: Categoría eliminada con éxito.
 *       400:
 *         description: Error de validación (ID no es UUID válido) o violación de llave foránea (la categoría tiene insumos asignados).
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado.
 *       404:
 *         description: Categoría no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/suppliesCategories/:id', remove);

export default router;