import { Router } from 'express';
import { triggerTestReminders } from '../controllers/notificationLogController.js';

const router = Router();

/**
 * @swagger
 * /api/notifications/reminders/test:
 *   post:
 *     summary: Envía recordatorios de prueba para citas próximas sin registrar en bitácora
 *     tags: [Notifications]
 *     description: Consulta las citas próximas en ventana de 24h o 4h desde la vista de recordatorios y envía un mensaje de prueba por Telegram a los clientes vinculados, sin insertar filas en `notifications_log` para no interferir con el envío automático (CU-43). Requiere token de personal (manager o receptionist).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Envío de prueba ejecutado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Test reminders sent without logging
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalFound: { type: integer, example: 2 }
 *                     sent: { type: integer, example: 1 }
 *                     withoutTelegram: { type: integer, example: 1 }
 *                     failed: { type: integer, example: 0 }
 *       401:
 *         description: Token ausente, inválido o cuenta desactivada.
 *       403:
 *         description: No autorizado. Solo el personal (manager o receptionist) puede ejecutar envíos de prueba.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/notifications/reminders/test', triggerTestReminders);

export default router;