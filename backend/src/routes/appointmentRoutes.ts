import { Router } from 'express';
import { create } from '../controllers/appointmentController.js';

const router = Router();

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Agenda una nueva cita
 *     tags: [Appointments]
 *     description: |
 *       Agenda una cita para un barbero, uno o más servicios y un horario. `scheduledStart` debe ser uno de los `startTimes`
 *       devueltos por `GET /api/shops/{id}/availability` para ese barbero y esos mismos servicios. La duración de la cita es la suma de las duraciones de los servicios. Requiere token JWT.
 *       Permisos por rol:
 *       - client: solo para sí mismo (`clientId` se puede omitir); no puede agendar para invitados.
 *       - receptionist: para un cliente registrado (`clientId`) o un invitado (`guestClientName`), solo en su sucursal.
 *       - manager: para un cliente registrado (`clientId`) o un invitado (`guestClientName`), solo en las sucursales que administra.
 *       Si dos personas intentan reservar el mismo horario al mismo tiempo, solo una lo obtiene; la otra recibe 409.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shopId, barberId, serviceIds, scheduledStart]
 *             properties:
 *               shopId: { type: string, format: uuid }
 *               barberId: { type: string, format: uuid }
 *               serviceIds:
 *                 type: array
 *                 minItems: 1
 *                 items: { type: string, format: uuid }
 *                 description: Servicios de la cita, sin repetir.
 *               scheduledStart:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-10-20T09:00:00.000Z"
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: Cliente registrado. Excluyente con guestClientName.
 *               guestClientName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Nombre del cliente no registrado. Excluyente con clientId.
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Cita creada. `data` contiene la cita con `barberId` y la lista `services` agendados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     shopId: { type: string, format: uuid }
 *                     barberId: { type: string, format: uuid }
 *                     clientId: { type: string, format: uuid, nullable: true }
 *                     isRegisteredClient: { type: boolean }
 *                     guestClientName: { type: string, nullable: true }
 *                     status: { type: string, example: scheduled }
 *                     scheduledStart: { type: string, format: date-time }
 *                     scheduledEnd: { type: string, format: date-time }
 *                     notes: { type: string, nullable: true }
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serviceId: { type: string, format: uuid }
 *                           priceAtBooking: { type: number, example: 200 }
 *                           durationMinutesAtBooking: { type: integer, example: 30 }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: Appointment created successfully }
 *       400:
 *         description: Error de validación en los campos proporcionados (p. ej. serviceIds vacío o con repetidos).
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: Cuenta desactivada o el rol no tiene permiso para agendar esta cita.
 *       404:
 *         description: Sucursal, barbero, servicio o cliente no encontrado / inactivo.
 *       409:
 *         description: El horario ya no está disponible.
 *       422:
 *         description: Fecha pasada o fuera del rango agendable, o falta clientId / guestClientName.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/appointments', create);

export default router;
