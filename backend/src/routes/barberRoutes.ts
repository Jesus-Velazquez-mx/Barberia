import { Router } from 'express';
import { getById, listByShop, create, update, remove } from '../controllers/barberController.js';

const router = Router();

/**
 * @swagger
 * /api/barbers/shop/{id}:
 *   get:
 *     summary: Obtiene el catálogo de barberos activos de una sucursal
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     description: Retorna la lista de todos los barberos asignados a una sucursal específica que actualmente están aceptando reservas y no han sido dados de baja. Cualquier usuario autenticado en el sistema puede acceder a esta información.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sucursal (shop_id) a consultar.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de barberos disponibles.
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
 *                       firstName: { type: string, example: "Juan" }
 *                       lastName: { type: string, example: "Pérez" }
 *                       email: { type: string, format: email, example: "juan.perez@barberia.com" }
 *                       phone: { type: string, example: "5551234567" }
 *                       shopId: { type: string, format: uuid }
 *                       shiftId: { type: string, format: uuid }
 *                       bio: { type: string, example: "Especialista en cortes clásicos y barba." }
 *                       isAcceptingBookings: { type: boolean, example: true }
 *                 message: { type: string, example: Barbers retrieved successfully }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       400:
 *         description: El formato del ID de la sucursal no es un UUID válido.
 *       401:
 *         description: No autorizado. Token faltante, expirado o inválido.
 *       404:
 *         description: La sucursal indicada no existe en el sistema.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/barbers/shop/:id', listByShop);

/**
 * @swagger
 * /api/barbers/{id}:
 *   get:
 *     summary: Obtiene el detalle de un barbero específico
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     description: Busca y retorna la información detallada de un barbero a partir de su identificador UUID. Cualquier usuario autenticado puede realizar esta consulta.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del barbero a consultar.
 *     responses:
 *       200:
 *         description: Barbero encontrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid, example: "550e8400-e29b-41d4-a716-446655440000" }
 *                     firstName: { type: string, example: "Juan" }
 *                     lastName: { type: string, example: "Pérez" }
 *                     email: { type: string, format: email, example: "juan.perez@barberia.com" }
 *                     phone: { type: string, example: "5551234567" }
 *                     shopId: { type: string, format: uuid }
 *                     shiftId: { type: string, format: uuid }
 *                     bio: { type: string, example: "Especialista en cortes clásicos y barba." }
 *                     isAcceptingBookings: { type: boolean, example: true }
 *                 message: { type: string, example: Barber retrieved successfully }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       400:
 *         description: El formato del ID proporcionado no es un UUID válido.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: No se encontró el barbero solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/barbers/:id', getById);

/**
 * @swagger
 * /api/barbers:
 *   post:
 *     summary: Registra o reactiva un barbero en el sistema
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     description: Crea un nuevo perfil de barbero. Si se intenta registrar un correo que ya pertenece a un barbero dado de baja lógicamente, el sistema aplicará un UPSERT reactivando al barbero con los nuevos datos proporcionados. Requiere estrictamente rol de 'manager'. Los barberos no poseen cuenta de acceso propio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - birthDate
 *               - gender
 *               - shopId
 *               - shiftId
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Carlos"
 *               lastName:
 *                 type: string
 *                 example: "Gómez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "carlos.gomez@barberia.com"
 *               phone:
 *                 type: string
 *                 example: "5559876543"
 *               birthDate:
 *                 type: string
 *                 example: "1992-05-15"
 *               gender:
 *                 type: string
 *                 example: "M"
 *               shopId:
 *                 type: string
 *                 format: uuid
 *                 example: "660e8400-e29b-41d4-a716-446655440111"
 *               shiftId:
 *                 type: string
 *                 format: uuid
 *                 example: "770e8400-e29b-41d4-a716-446655440222"
 *               bio:
 *                 type: string
 *                 example: "Experto en diseño de barba."
 *               isAcceptingBookings:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Barbero registrado o reactivado exitosamente.
 *       400:
 *         description: Error de validación en los datos enviados (ej. formato de fecha incorrecto o faltan campos).
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un usuario con rol de manager puede registrar barberos.
 *       404:
 *         description: La sucursal o el turno indicados no existen.
 *       409:
 *         description: Conflicto. El correo electrónico o número de teléfono ya está en uso por un barbero activo.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/barbers', create);

/**
 * @swagger
 * /api/barbers:
 *   put:
 *     summary: Actualiza el perfil público de un barbero
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     description: Modifica la biografía o la disponibilidad para recibir reservas de un barbero. Al menos uno de estos dos campos debe ser enviado. Requiere rol de 'manager'. (El cambio de sucursal o turno se maneja en endpoints administrativos independientes).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               bio:
 *                 type: string
 *                 example: "Especialista en degradados y tintes actualizados."
 *               isAcceptingBookings:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Perfil del barbero actualizado exitosamente.
 *       400:
 *         description: Error de validación (ej. ID inválido o cuerpo de petición vacío).
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un manager puede editar el perfil del barbero.
 *       404:
 *         description: No se encontró el barbero a actualizar.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/barbers', update);

/**
 * @swagger
 * /api/barbers/{id}:
 *   delete:
 *     summary: Borrado lógico de un barbero (Baja)
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     description: Da de baja a un barbero cambiando su estado (registrando el timestamp en `deleted_at`). Previene la eliminación si el barbero cuenta con citas pendientes (agendadas o en proceso). Requiere rol de 'manager'.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del barbero a dar de baja.
 *     responses:
 *       200:
 *         description: Barbero dado de baja exitosamente.
 *       400:
 *         description: El formato del ID proporcionado no es válido, o el barbero tiene citas pendientes que impiden su baja.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un manager puede eliminar barberos.
 *       404:
 *         description: No se encontró el barbero a eliminar.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/barbers/:id', remove);

export default router;