import { Router } from 'express';
import { listAll, getById, create, update, remove } from '../controllers/offeredServiceController.js';

const router = Router();

/**
 * @swagger
 * /api/offeredServices:
 *   get:
 *     summary: Obtiene el catálogo de servicios
 *     tags: [OfferedServices]
 *     security:
 *       - bearerAuth: []
 *     description: Retorna la lista de todos los servicios ofrecidos por la barbería. Si el usuario es 'client', solo retorna los servicios activos. Si es 'manager' o 'receptionist', retorna todos (activos e inactivos).
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra los servicios por el ID de la categoría a la que pertenecen.
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
 *                       id: { type: string, format: uuid, example: "550e8400-e29b-41d4-a716-446655440000" }
 *                       categoryId: { type: string, format: uuid, example: "660e8400-e29b-41d4-a716-446655440111" }
 *                       name: { type: string, example: "Corte clásico" }
 *                       description: { type: string, nullable: true, example: "Corte tradicional con tijera y máquina." }
 *                       durationMinutes: { type: integer, example: 30 }
 *                       price: { type: number, format: float, example: 250.00 }
 *                       isActive: { type: boolean, example: true }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: Services retrieved successfully }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       401:
 *         description: No autorizado. Token faltante o inválido.
 *       500:
 *         description: Error interno del servidor al consultar los servicios.
 */
router.get('/offeredServices', listAll);

/**
 * @swagger
 * /api/offeredServices/{id}:
 *   get:
 *     summary: Obtiene un servicio específico por su ID
 *     tags: [OfferedServices]
 *     security:
 *       - bearerAuth: []
 *     description: Busca y retorna el detalle de un servicio a partir de su identificador UUID. Si un 'client' intenta acceder a un servicio inactivo, recibe un 404.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del servicio a consultar.
 *     responses:
 *       200:
 *         description: Servicio encontrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid, example: "550e8400-e29b-41d4-a716-446655440000" }
 *                     categoryId: { type: string, format: uuid, example: "660e8400-e29b-41d4-a716-446655440111" }
 *                     name: { type: string, example: "Corte clásico" }
 *                     description: { type: string, nullable: true, example: "Corte tradicional con tijera y máquina." }
 *                     durationMinutes: { type: integer, example: 30 }
 *                     price: { type: number, format: float, example: 250.00 }
 *                     isActive: { type: boolean, example: true }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: Service retrieved successfully }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       400:
 *         description: El formato del ID proporcionado no es un UUID válido.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: No se encontró el servicio solicitado (o está inactivo para un cliente).
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/offeredServices/:id', getById);

/**
 * @swagger
 * /api/offeredServices:
 *   post:
 *     summary: Registra un nuevo servicio en el catálogo
 *     tags: [OfferedServices]
 *     security:
 *       - bearerAuth: []
 *     description: Crea un nuevo servicio. Requiere rol de 'manager'.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - name
 *               - durationMinutes
 *               - price
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "660e8400-e29b-41d4-a716-446655440111"
 *               name:
 *                 type: string
 *                 example: "Mascarilla Negra"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Limpieza profunda con carbón activado."
 *               durationMinutes:
 *                 type: integer
 *                 example: 15
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 150.00
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente.
 *       400:
 *         description: Error de validación en los datos enviados.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un manager puede realizar esta acción.
 *       404:
 *         description: La categoría de servicio indicada no existe.
 *       409:
 *         description: Conflicto. Ya existe un servicio con ese nombre.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/offeredServices', create);

/**
 * @swagger
 * /api/offeredServices/{id}:
 *   put:
 *     summary: Actualiza un servicio existente
 *     tags: [OfferedServices]
 *     security:
 *       - bearerAuth: []
 *     description: Modifica los datos de un servicio específico. Requiere rol de 'manager'.
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
 *                 example: "660e8400-e29b-41d4-a716-446655440111"
 *               name:
 *                 type: string
 *                 example: "Mascarilla Negra Premium"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Limpieza profunda con exfoliación."
 *               durationMinutes:
 *                 type: integer
 *                 example: 20
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 200.00
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Servicio actualizado exitosamente.
 *       400:
 *         description: Error de validación. (Ej. formato de ID inválido o no se envió ningún campo a actualizar).
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un manager puede actualizar servicios.
 *       404:
 *         description: No se encontró el servicio o la nueva categoría.
 *       409:
 *         description: Conflicto. El nuevo nombre ya está en uso.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/offeredServices/:id', update);

/**
 * @swagger
 * /api/offeredServices/{id}:
 *   delete:
 *     summary: Borrado lógico de un servicio
 *     tags: [OfferedServices]
 *     security:
 *       - bearerAuth: []
 *     description: Inhabilita un servicio cambiando su estado 'isActive' a falso. Requiere rol de 'manager'.
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
 *         description: Servicio eliminado exitosamente.
 *       400:
 *         description: El formato del ID proporcionado no es válido.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un manager puede eliminar servicios.
 *       404:
 *         description: No se encontró el servicio a eliminar.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/offeredServices/:id', remove);

export default router;