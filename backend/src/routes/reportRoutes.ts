import { Router } from 'express';
import { barberPerformance } from '../controllers/reportController.js';

const router = Router();

/**
 * @swagger
 * /api/reports/barber-performance:
 *   get:
 *     summary: Genera el reporte de desempeño de uno o varios barberos
 *     tags: [Reports]
 *     description: Solo managers, y únicamente de las sucursales que tienen a su cargo (activas o inactivas). Cada cita cuenta en el día de su inicio programado, en la zona horaria del negocio. Se consideran agendadas todas las citas del rango sin importar su estado, y finalizadas las que tienen estado `completed`. Incluye a los barberos dados de baja o reasignados a otra sucursal del mismo manager si tuvieron citas en la sucursal dentro del rango.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sucursal a evaluar.
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-11-01"
 *         description: Fecha de inicio (inclusiva).
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-11-30"
 *         description: Fecha de fin (inclusiva). No puede ser anterior a `startDate`.
 *       - in: query
 *         name: firstName
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Nombre(s) del barbero. No distingue mayúsculas ni acentos y coincide al inicio de cualquier palabra. Si se omite junto con `lastName`, se evalúa a todos los barberos de la sucursal.
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Apellido(s) del barbero. Mismas reglas que `firstName`.
 *     responses:
 *       200:
 *         description: Reporte generado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     shopId: { type: string, format: uuid }
 *                     shopName: { type: string, example: "Sucursal Centro" }
 *                     startDate: { type: string, format: date }
 *                     endDate: { type: string, format: date }
 *                     totals:
 *                       type: object
 *                       properties:
 *                         scheduledAppointments: { type: integer, example: 20 }
 *                         completedAppointments: { type: integer, example: 15 }
 *                         scheduledServices: { type: integer, example: 32 }
 *                         completedServices: { type: integer, example: 24 }
 *                         cancelledServices: { type: integer, example: 3 }
 *                         noShowServices: { type: integer, example: 2 }
 *                         pendingServices: { type: integer, example: 3, description: "Sin desenlace aún (scheduled, rescheduled o checked_in)" }
 *                         completionPercentage: { type: number, nullable: true, example: 75 }
 *                     barbers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           barberId: { type: string, format: uuid }
 *                           firstName: { type: string, example: "Juan" }
 *                           lastName: { type: string, example: "Pérez" }
 *                           email: { type: string, format: email }
 *                           assignedShopId: { type: string, format: uuid }
 *                           assignedShopName: { type: string, example: "Sucursal Centro" }
 *                           isActive: { type: boolean, example: true }
 *                           scheduledAppointments: { type: integer, example: 10 }
 *                           completedAppointments: { type: integer, example: 8 }
 *                           scheduledServices: { type: integer, example: 16 }
 *                           completedServices: { type: integer, example: 12 }
 *                           cancelledServices: { type: integer, example: 2 }
 *                           noShowServices: { type: integer, example: 1 }
 *                           pendingServices: { type: integer, example: 1, description: "Sin desenlace aún (scheduled, rescheduled o checked_in)" }
 *                           completionPercentage: { type: number, nullable: true, example: 75, description: "null si el barbero no tuvo servicios agendados en el rango" }
 *                 message: { type: string, example: Report generated successfully }
 *       400:
 *         description: El rango de fechas no es válido ("El rango de fechas proporcionado no es válido.") o algún parámetro no cumple el formato.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: El usuario no es manager, su cuenta está desactivada o la sucursal no está a su cargo ("No cuenta con permisos para generar reportes de esta sucursal.").
 *       404:
 *         description: No hay servicios finalizados en el rango ("No hay datos suficientes para generar el reporte en el rango de fechas indicado.") o ningún barbero coincide con el nombre ("No se encontraron barberos con los datos proporcionados en esta sucursal.").
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/reports/barber-performance', barberPerformance);

export default router;
