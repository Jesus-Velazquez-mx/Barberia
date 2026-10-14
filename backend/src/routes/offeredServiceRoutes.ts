import { Router } from 'express';
import { listAll, getById } from '../controllers/offeredServiceController.js';

const router = Router();

/**
 * @swagger
 * /api/offeredServices:
 *   get:
 *     summary: Obtiene el catálogo de servicios activos
 *     tags: [OfferedServices]
 *     description: Retorna la lista de todos los servicios activos ofrecidos por la barbería, ordenados alfabéticamente por nombre.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de servicios disponibles.
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
 *                       id: { type: string, format: uuid, example: "550e8400-e29b-41d4-a716-446655440000" }
 *                       categoryId: { type: string, format: uuid, example: "660e8400-e29b-41d4-a716-446655440111" }
 *                       name: { type: string, example: "Corte clásico" }
 *                       description: { type: string, nullable: true, example: "Corte tradicional con tijera y máquina." }
 *                       durationMinutes: { type: integer, example: 30 }
 *                       price: { type: number, format: float, example: 250.00 }
 *                       isActive: { type: boolean, example: true }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: Services retrieved successfully }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       500:
 *         description: Error interno del servidor al consultar los servicios.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Internal server error }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.get('/offeredServices', listAll);

/**
 * @swagger
 * /api/offeredServices/{id}:
 *   get:
 *     summary: Obtiene un servicio específico por su ID
 *     tags: [OfferedServices]
 *     description: Busca y retorna el detalle de un servicio a partir de su identificador UUID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del servicio a consultar.
 *     responses:
 *       200:
 *         description: Servicio encontrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid, example: "550e8400-e29b-41d4-a716-446655440000" }
 *                     categoryId: { type: string, format: uuid, example: "660e8400-e29b-41d4-a716-446655440111" }
 *                     name: { type: string, example: "Corte clásico" }
 *                     description: { type: string, nullable: true, example: "Corte tradicional con tijera y máquina." }
 *                     durationMinutes: { type: integer, example: 30 }
 *                     price: { type: number, format: float, example: 250.00 }
 *                     isActive: { type: boolean, example: true }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: Service retrieved successfully }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       400:
 *         description: El formato del ID proporcionado no es un UUID válido.
 *       404:
 *         description: No se encontró el servicio solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/offeredServices/:id', getById);

export default router;