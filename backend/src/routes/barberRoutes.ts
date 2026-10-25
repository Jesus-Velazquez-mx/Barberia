import { Router } from 'express';
import { getById, create, update, remove } from '../controllers/barberController.js';

const router = Router();

/**
 * @swagger
 * /api/barbers/{id}:
 *   get:
 *     summary: Obtiene el detalle de un barbero específico
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     description: Busca y retorna la información de un barbero a partir de su identificador UUID. Requiere token JWT. Los datos devueltos dependen del rol. Los clientes reciben solo la vista pública (`id`, `firstName`, `lastName`, `shopId`, `shiftId`, `bio`) y únicamente de barberos activos que aceptan reservas (si el barbero está dado de baja o no acepta reservas responde 404). El personal (gerentes y recepcionistas) recibe el perfil completo de cualquier barbero, incluidos los dados de baja.
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
 *         description: Barbero encontrado exitosamente. Los campos marcados como "solo personal" únicamente se incluyen para gerentes y recepcionistas.
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
 *                     shopId: { type: string, format: uuid }
 *                     shiftId: { type: string, format: uuid }
 *                     bio: { type: string, nullable: true, example: "Especialista en cortes clásicos y barba." }
 *                     email: { type: string, format: email, nullable: true, example: "juan.perez@barberia.com", description: Solo personal }
 *                     phone: { type: string, nullable: true, example: "5551234567", description: Solo personal }
 *                     birthDate: { type: string, format: date-time, description: Solo personal }
 *                     gender: { type: string, example: "M", description: Solo personal }
 *                     isAcceptingBookings: { type: boolean, example: true, description: Solo personal }
 *                     deletedAt: { type: string, format: date-time, nullable: true, example: null, description: Solo personal }
 *                     createdAt: { type: string, format: date-time, description: Solo personal }
 *                     updatedAt: { type: string, format: date-time, description: Solo personal }
 *                 message: { type: string, example: Barber retrieved successfully }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       400:
 *         description: El formato del ID proporcionado no es un UUID válido.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: No se encontró el barbero solicitado (o, para un cliente, está dado de baja o no acepta reservas).
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
 *                 example: "male"
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
 * /api/barbers/{id}:
 *   put:
 *     summary: Actualiza la información de un barbero
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     description: Modifica cualquier dato de un barbero. Al menos un campo debe ser enviado. Requiere rol de 'manager'. (El cambio de sucursal o turno se maneja en endpoints administrativos independientes).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del barbero a modificar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Juan"
 *               lastName:
 *                 type: string
 *                 example: "Pérez"
 *               email:
 *                 type: string
 *                 example: "juanperez2@email.com"
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *               birthDate:
 *                 type: string
 *                 example: "1992-05-15"
 *               gender:
 *                 type: string
 *                 example: "male"
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
router.put('/barbers/:id', update);

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