import { Router } from "express";
import { list, getById } from '../controllers/shopController.js';
import { listByShop } from '../controllers/barberController.js';

const router = Router();

/**
 * @swagger
 * /api/shops:
 *   get:
 *     summary: Obtiene la lista de sucursales activas
 *     tags: [Shops]
 *     description: Retorna un listado con todas las sucursales activas, ordenadas alfabéticamente. Endpoint público, ideal para que los clientes exploren las opciones antes de agendar.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de sucursales.
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
 *                       name: { type: string }
 *                       street: { type: string, nullable: true }
 *                       postalCode: { type: string, nullable: true }
 *                       number: { type: string, nullable: true }
 *                       phone: { type: string, nullable: true }
 *                       isActive: { type: boolean }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: Active shops retrieved successfully }
 *                 error: { nullable: true, example: null }
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/shops', list);

/**
 * @swagger
 * /api/shops/{id}:
 *   get:
 *     summary: Obtiene los detalles de una sucursal específica
 *     tags: [Shops]
 *     description: Recupera la información de una sucursal activa según su ID. Si la sucursal está inactiva o no existe, retorna 404 (las sucursales inactivas no deben ser agendables). Endpoint público.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único de la sucursal.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene la información de la sucursal.
 *       400:
 *         description: Error de validación (el ID no es un UUID válido).
 *       404:
 *         description: Sucursal no encontrada o inactiva.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/shops/:id', getById);

/**
 * @swagger
 * /api/shops/{id}/barbers:
 *   get:
 *     summary: Obtiene los barberos disponibles en una sucursal específica
 *     tags: [Shops, Barbers]
 *     description: Expone qué barberos de una sucursal aceptan reservas actualmente. Excluye a barberos dados de baja o que no aceptan reservas en este momento. Endpoint público.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único de la sucursal.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de barberos elegibles (puede estar vacío `[]` si la sucursal existe pero no tiene barberos disponibles).
 *       400:
 *         description: Error de validación (el ID no es un UUID válido).
 *       404:
 *         description: La sucursal especificada no existe.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/shops/:id/barbers', listByShop);

export default router;