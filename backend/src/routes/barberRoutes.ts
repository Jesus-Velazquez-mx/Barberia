import { Router } from "express";
import { update } from '../controllers/barberController.js';

const router = Router();

/**
 * @swagger
 * /api/barbers:
 *   put:
 *     summary: Actualiza los atributos específicos de un barbero
 *     description: Actualiza la biografía y/o la disponibilidad para recibir reservas de un barbero. Al menos uno de los dos campos debe estar presente. El cambio de turno y de sucursal se realizan mediante endpoints especializados.
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
 *                     userId: { type: string, format: uuid }
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

export default router;
