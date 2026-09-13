import { Router } from 'express';
import recommendationController from '../controllers/recommendationController.js';

const router = Router();

const { testAiService } = recommendationController;

/**
 * @swagger
 * /api/recommendation/test:
 *   get:
 *     summary: Verifica la conexión con el microservicio de recomendación
 *     description: Llama al endpoint de salud del microservicio de IA y retorna su estado.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el estado reportado por el microservicio de IA.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     status: { type: string, example: ok }
 *                 message: { type: string, example: Conexión con el servicio de recomendación exitosa }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       500:
 *         description: No fue posible conectar con el microservicio de IA.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Error al conectar con el servicio de recomendación }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.get('/recommendation/test', testAiService);

export default router;
