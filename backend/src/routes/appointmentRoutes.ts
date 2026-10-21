import { Router } from 'express';
import { create, list } from '../controllers/appointmentController.js';

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

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Consulta citas
 *     tags: [Appointments]
 *     description: |
 *       Lista las citas cuyo inicio programado (`scheduledStart`) cae dentro de [`from`, `to`] (ambos inclusivos), ordenadas por inicio.
 *       Sin `from` ni `to` se usan los próximos 30 días: de hoy 00:00 al día 30 a las 23:59:59.999, en la zona horaria del negocio.
 *       Si solo falta uno: `from` = hoy 00:00 y `to` = `from` + 30 días. El rango no puede ser negativo ni exceder 366 días. Requiere token JWT.
 *       Alcance por rol:
 *       - client: solo sus propias citas. Los filtros `clientId`, `shopId`, `clientType` y `barberId` se ignoran.
 *       - receptionist: las citas de la sucursal donde trabaja.
 *       - manager: las citas de las sucursales que administra.
 *       Un `shopId` fuera del alcance del personal responde 403.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Inicio del rango (ISO 8601, admite desfase horario). Por defecto hoy 00:00 hora del negocio.
 *         example: "2026-10-01T00:00:00-07:00"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Fin del rango, inclusivo. Por defecto el día 30 a las 23:59:59.999 hora del negocio.
 *         example: "2026-10-31T23:59:59-07:00"
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items: { type: string, enum: [scheduled, checked_in, completed, cancelled, no_show] }
 *         style: form
 *         explode: false
 *         description: Uno o varios estados, separados por comas o repitiendo el parámetro.
 *       - in: query
 *         name: clientId
 *         schema: { type: string, format: uuid }
 *         description: Solo recepción y gerentes. Citas de un cliente registrado.
 *       - in: query
 *         name: shopId
 *         schema: { type: string, format: uuid }
 *         description: Solo recepción y gerentes. Sucursal concreta (útil para gerentes con varias sucursales).
 *       - in: query
 *         name: clientType
 *         schema: { type: string, enum: [registered, visitor] }
 *         description: Solo recepción y gerentes. `registered` = agendadas por clientes registrados; `visitor` = clientes no registrados (invitados / walk-in).
 *       - in: query
 *         name: barberId
 *         schema: { type: string, format: uuid }
 *         description: Solo recepción y gerentes. Citas de un barbero.
 *     responses:
 *       200:
 *         description: Lista de citas (puede estar vacía). Cada cita incluye su lista `services`.
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
 *                       id: { type: string, format: uuid }
 *                       shopId: { type: string, format: uuid }
 *                       barberId: { type: string, format: uuid }
 *                       clientId: { type: string, format: uuid, nullable: true }
 *                       isRegisteredClient: { type: boolean }
 *                       guestClientName: { type: string, nullable: true }
 *                       status: { type: string, example: scheduled }
 *                       scheduledStart: { type: string, format: date-time }
 *                       scheduledEnd: { type: string, format: date-time }
 *                       notes: { type: string, nullable: true }
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             serviceId: { type: string, format: uuid }
 *                             priceAtBooking: { type: number, example: 200 }
 *                             durationMinutesAtBooking: { type: integer, example: 30 }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: Appointments retrieved successfully }
 *       400:
 *         description: Parámetros inválidos (UUID, fecha, estado o clientType), `to` anterior a `from` o rango mayor a 366 días.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: Cuenta desactivada, recepcionista sin sucursal o `shopId` fuera de las sucursales del solicitante.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/appointments', list);

export default router;
