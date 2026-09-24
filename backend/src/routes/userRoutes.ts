import { Router } from "express";
import { update } from '../controllers/userController.js';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   put:
 *     summary: Actualiza la información general de un usuario
 *     description: Actualiza los datos comunes a todos los roles (email, teléfono, contraseña, nombre y apellido). Los atributos específicos de cada rol se actualizan mediante endpoints especializados.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user, token]
 *             properties:
 *               user:
 *                 type: object
 *                 required: [id]
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   email: { type: string, format: email, example: cliente@mrbarber.com }
 *                   phone: { type: string, minLength: 10, maxLength: 10, example: "3312345678" }
 *                   password: { type: string, minLength: 6, example: password123 }
 *                   firstName: { type: string, minLength: 2, example: Juan }
 *                   lastName: { type: string, minLength: 2, example: Pérez }
 *               token: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el usuario actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     role: { type: string, enum: [client, barber, manager, receptionist] }
 *                     email: { type: string, format: email }
 *                     phone: { type: string, nullable: true }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: User updated successfully }
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
 *                 error: { type: array, items: { type: string }, example: ["Invalid email"] }
 *       401:
 *         description: Token inválido o no autorizado para actualizar este usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Unauthorized }
 *                 error: { nullable: true, example: null }
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: User not found }
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
router.put('/users', update);

export default router;