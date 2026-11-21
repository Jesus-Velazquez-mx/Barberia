import { Router } from 'express';
import { getTimezone } from '../controllers/businessTimezoneController.js';

const router = Router();

/**
 * @swagger
 * /api/business-timezone:
 *   get:
 *     summary: Obtiene la zona horaria del negocio
 *     tags: [Business]
 *     description: >
 *       Devuelve la zona horaria IANA (`BUSINESS_TIMEZONE`) en la que se calculan y muestran
 *       las fechas y horas de las citas. Endpoint público: no requiere autenticación.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el identificador IANA de la zona horaria.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: string, example: America/Mazatlan }
 *                 message: { type: string, example: Zona horaria del negocio obtenida correctamente }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 */
router.get('/business-timezone', getTimezone);

export default router;
