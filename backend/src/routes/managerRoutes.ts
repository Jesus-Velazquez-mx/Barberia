import { Router } from "express";
import { update } from '../controllers/managerController.js';

const router = Router();

/**
 * @swagger
 * /api/managers:
 *   put:
 *     summary: Actualiza el título de un manager
 *     description: Actualiza el atributo `title` de un manager. El cambio de sucursal se realiza mediante un endpoint especializado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manager, token]
 *             properties:
 *               manager:
 *                 type: object
 *                 required: [id, title]
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   title: { type: string, minLength: 1, maxLength: 100, example: "Gerente de sucursal" }
 *               token: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el manager actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: string, format: uuid }
 *                     title: { type: string, nullable: true }
 *                 message: { type: string, example: Manager updated successfully }
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
 *                 error: { type: array, items: { type: string }, example: ["Invalid input"] }
 *       401:
 *         description: Token inválido o no autorizado para actualizar este manager.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Unauthorized }
 *                 error: { nullable: true, example: null }
 *       404:
 *         description: Manager no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Manager not found }
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
router.put('/managers', update);

export default router;
