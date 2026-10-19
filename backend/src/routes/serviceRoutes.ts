import { Router } from 'express';
import { list, getById, create, update, remove } from '../controllers/serviceController.js';

const router = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Obtiene la lista de servicios para administración
 *     tags: [Services]
 *     description: Retorna un listado de servicios del catálogo con filtros opcionales por categoría o estado activo. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra los servicios por ID de categoría.
 *       - in: query
 *         name: isActive
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtra los servicios según si están activos o inactivos.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de servicios.
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
 *                       categoryId: { type: string, format: uuid }
 *                       name: { type: string }
 *                       description: { type: string, nullable: true }
 *                       durationMinutes: { type: integer }
 *                       price: { type: number }
 *                       isActive: { type: boolean }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: Services retrieved successfully }
 *                 error: { nullable: true, example: null }
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para consultar servicios.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/services', list);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Registra un nuevo servicio en el catálogo
 *     tags: [Services]
 *     description: Permite a un manager crear un nuevo servicio asociándolo a una categoría existente. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, name, durationMinutes, price]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "5750bab7-2364-4955-829c-44bcb11b3b1f"
 *               name:
 *                 type: string
 *                 maxLength: 150
 *                 example: "Corte Degradado"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Corte fade con navaja y peinado profesional"
 *               durationMinutes:
 *                 type: integer
 *                 example: 30
 *               price:
 *                 type: number
 *                 example: 280.00
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Servicio creado con éxito.
 *       400:
 *         description: Error de validación en los datos proporcionados.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para crear servicios.
 *       404:
 *         description: La categoría de servicios especificada no existe.
 *       409:
 *         description: Ya existe un servicio con ese nombre.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/services', create);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Obtiene el detalle de un servicio por ID
 *     tags: [Services]
 *     description: Retorna la información de un servicio del catálogo. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del servicio.
 *     responses:
 *       200:
 *         description: Servicio encontrado exitosamente.
 *       400:
 *         description: Formato de ID inválido.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para consultar el servicio.
 *       404:
 *         description: Servicio no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/services/:id', getById);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Actualiza un servicio existente
 *     tags: [Services]
 *     description: Modifica los datos de un servicio existente en el catálogo. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del servicio a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 maxLength: 150
 *               description:
 *                 type: string
 *                 nullable: true
 *               durationMinutes:
 *                 type: integer
 *               price:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Servicio actualizado con éxito.
 *       400:
 *         description: Datos inválidos o ningún campo proporcionado.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para actualizar el servicio.
 *       404:
 *         description: Servicio o categoría no encontrada.
 *       409:
 *         description: El nombre del servicio ya está en uso.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/services/:id', update);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Elimina lógicamente un servicio
 *     tags: [Services]
 *     description: Realiza un borrado lógico marcando `is_active = false`. No borra físicamente la fila para mantener la integridad con citas pasadas. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del servicio a eliminar.
 *     responses:
 *       200:
 *         description: Servicio eliminado lógicamente con éxito.
 *       400:
 *         description: Formato de ID inválido.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Usuario no autorizado para eliminar el servicio.
 *       404:
 *         description: Servicio no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/services/:id', remove);

export default router;
