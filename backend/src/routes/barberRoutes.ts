import { Router } from 'express';
import { update, remove } from '../controllers/barberController.js';

const router = Router();

/**
 * @swagger
 * /api/barbers:
 *   put:
 *     summary: Actualiza los atributos específicos de un barbero
 *     tags: [Barbers]
 *     description: Actualiza la biografía y/o la disponibilidad para recibir reservas de un barbero. Al menos uno de los dos campos debe estar presente. El cambio de turno y de sucursal se realizan mediante endpoints especializados. Los barberos no tienen cuenta de usuario ni token propio, solo un manager puede realizar esta acción.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [barber, token]
 *             properties:
 *               barber:
 *                 type: object
 *                 required: [id]
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   bio: { type: string, maxLength: 2000, example: "Especialista en cortes clásicos y degradados." }
 *                   isAcceptingBookings: { type: boolean, example: true }
 *               token: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el barbero actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     email: { type: string, format: email, nullable: true }
 *                     phone: { type: string, nullable: true }
 *                     shopId: { type: string, format: uuid }
 *                     shiftId: { type: string, format: uuid }
 *                     bio: { type: string, nullable: true }
 *                     isAcceptingBookings: { type: boolean }
 *                 message: { type: string, example: Barber updated successfully }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       400:
 *         description: Error de validación de los datos enviados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Error de validación }
 *                 error: { type: array, items: { type: string }, example: ["At least one of bio or isAcceptingBookings must be provided"] }
 *       401:
 *         description: Token inválido o no autorizado para actualizar este barbero.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Unauthorized }
 *                 error: { nullable: true, example: null }
 *       404:
 *         description: Barbero no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Barber not found }
 *                 error: { nullable: true, example: null }
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Internal server error }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.put('/barbers', update);

/**
 * @swagger
 * /api/barbers/{id}:
 *   delete:
 *     summary: Da de baja lógicamente a un barbero
 *     tags: [Barbers]
 *     description: Marca `deleted_at` con la fecha y hora actual para el barbero indicado. Requiere un token JWT válido de un manager; los barberos no tienen cuenta de usuario ni token propio, así que nunca pueden realizar esta acción por sí mismos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del barbero a dar de baja.
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         description: Token JWT de un manager para autorizar la petición. Debe tener el prefijo "Bearer ".
 *     responses:
 *       200:
 *         description: Éxito. El barbero fue dado de baja correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Barber deleted successfully }
 *                 error: { nullable: true, example: null }
 *       400:
 *         description: Error de validación (por ejemplo, el ID proporcionado no es un UUID válido).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Validation error }
 *                 error: { type: array, items: { type: string }, example: ["Invalid uuid format"] }
 *       401:
 *         description: No autorizado. Token ausente, expirado o inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Missing or invalid authorization token }
 *                 error: { nullable: true, example: null }
 *       403:
 *         description: Prohibido. Solo un manager puede dar de baja a un barbero.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: "Not authorized to delete this barber" }
 *                 error: { nullable: true, example: null }
 *       404:
 *         description: Barbero no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Barber not found }
 *                 error: { nullable: true, example: null }
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Internal server error }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.delete('/barbers/:id', remove);

export default router;
