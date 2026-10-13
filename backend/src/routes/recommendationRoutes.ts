import { Router } from 'express';
import { testAiService, getHaircutRecommendation } from '../controllers/recommendationController.js';
import { getBucketPresignedURL } from '../controllers/bucketController.js';

const router = Router();

/**
 * @swagger
 * /api/recommendation/test:
 *   get:
 *     summary: Verifica la conexión con el microservicio de recomendación
 *     tags: [Recommendation]
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

/**
 * @swagger
 * /api/recommendation/generate:
 *   post:
 *     summary: Genera recomendaciones de cortes de cabello
 *     tags: [Recommendation]
 *     description: Genera recomendaciones personalizadas para el cliente autenticado usando su fotografía, edad, género y preferencias. Requiere un token JWT de un cliente en el header `Authorization` (formato `Bearer <token>`).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recommendationParams]
 *             properties:
 *               recommendationParams:
 *                 type: object
 *                 required: [photo]
 *                 properties:
 *                   photo:
 *                     type: string
 *                     description: Fotografía del cliente, codificada como string.
 *                     example: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...
 *                   userPreferences:
 *                     type: string
 *                     maxLength: 500
 *                     description: Preferencias o indicaciones adicionales del cliente.
 *                     example: Prefiero un corte corto y fácil de mantener.
 *     responses:
 *       200:
 *         description: Recomendaciones generadas exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     haircuts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           name: { type: string, example: Fade clásico }
 *                           description: { type: string, example: Degradado progresivo en los laterales. }
 *                     suggestonText: { type: string, example: Este estilo se adapta a tus características. }
 *                     reasoning: { type: string, example: El corte favorece la estructura facial y tus preferencias. }
 *                     confidence: { type: number, format: float, minimum: 0, maximum: 1, example: 0.92 }
 *                 message: { type: string, example: Recomendación de corte generada exitosamente }
 *       400:
 *         description: Error de validación de los datos enviados.
 *       401:
 *         description: Token ausente, inválido o el usuario no es un cliente.
 *       404:
 *         description: No se encontró el cliente.
 *       500:
 *         description: Error al comunicarse con el servicio de recomendación o no hay estilos de corte disponibles.
 */
router.post('/recommendation/generate', getHaircutRecommendation);

/**
 * @swagger
 * /api/presigned-url:
 *   get:
 *     summary: Genera un formulario presignado para subir una imagen
 *     tags: [Storage]
 *     description: Genera una URL y los campos necesarios para subir una imagen directamente a S3. La carga debe enviarse como multipart/form-data, incluir todos los campos retornados y declarar un Content-Type que comience con image/. El archivo no puede superar los 5 MB.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Formulario presignado generado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, message]
 *               properties:
 *                 data:
 *                   type: object
 *                   required: [url, fields]
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                       description: URL de S3 a la que debe enviarse el formulario multipart.
 *                     fields:
 *                       type: object
 *                       additionalProperties:
 *                         type: string
 *                       description: Campos firmados que deben incluirse sin modificaciones en el formulario.
 *                 message:
 *                   type: string
 *                   example: Presigned URL generated successfully
 *       401:
 *         description: Token ausente, inválido o el usuario no es un cliente.
 *       502:
 *         description: No se pudieron resolver las credenciales de AWS.
 *       500:
 *         description: Error inesperado al generar el formulario presignado.
 */
router.get('/presigned-url', getBucketPresignedURL);

export default router;
