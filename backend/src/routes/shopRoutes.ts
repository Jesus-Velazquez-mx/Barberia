import { Router } from 'express';
import { list, getById, create, update, remove } from '../controllers/shopController.js';
import { listByShop } from '../controllers/barberController.js';
import { getAvailability } from '../controllers/availabilitySlotController.js';

const router = Router();

/**
 * @swagger
 * /api/shops:
 *   get:
 *     summary: Obtiene la lista de sucursales
 *     tags: [Shops]
 *     description: Retorna un listado con las sucursales ordenadas alfabéticamente. Por defecto devuelve solo las activas. Si se incluye el parámetro `includeInactive=true`, retorna todas las sucursales.
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         required: false
 *         schema:
 *           type: boolean
 *           example: false
 *         description: Si es true, incluye sucursales inactivas en el listado.
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
 * /api/shops:
 *   post:
 *     summary: Registra una nueva sucursal
 *     tags: [Shops]
 *     description: Permite a un administrador o manager registrar una nueva sucursal en el sistema. Requiere token JWT en el header `Authorization`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: Sucursal Centro
 *               street:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *                 example: Av. Hidalgo
 *               postalCode:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 5
 *                 nullable: true
 *                 example: "44100"
 *               number:
 *                 type: string
 *                 maxLength: 4
 *                 nullable: true
 *                 example: "123"
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 10
 *                 nullable: true
 *                 example: "3312345678"
 *               managerId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del manager asignado. Si se omite, se asigna el manager del token.
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Sucursal creada exitosamente.
 *       400:
 *         description: Error de validación en los campos proporcionados.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: Prohibido. El usuario no tiene rol de manager o su cuenta está desactivada.
 *       404:
 *         description: El manager asignado no existe o está desactivado.
 *       409:
 *         description: El nombre de la sucursal ya se encuentra en uso.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/shops', create);

/**
 * @swagger
 * /api/shops/{id}:
 *   get:
 *     summary: Obtiene los detalles de una sucursal específica
 *     tags: [Shops]
 *     description: Recupera la información de una sucursal activa según su ID. Si la sucursal está inactiva o no existe, retorna 404. Endpoint público.
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
 * /api/shops/{id}:
 *   put:
 *     summary: Edita una sucursal existente
 *     tags: [Shops]
 *     description: Actualiza los campos especificados de una sucursal. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único de la sucursal a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *               street:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *               postalCode:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 5
 *                 nullable: true
 *               number:
 *                 type: string
 *                 maxLength: 4
 *                 nullable: true
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 10
 *                 nullable: true
 *               managerId:
 *                 type: string
 *                 format: uuid
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Sucursal actualizada correctamente.
 *       400:
 *         description: Error de validación o ningún campo proporcionado.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado.
 *       404:
 *         description: Sucursal o manager asignado no encontrado.
 *       409:
 *         description: El nombre de la sucursal ya pertenece a otra tienda.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/shops/:id', update);

/**
 * @swagger
 * /api/shops/{id}:
 *   delete:
 *     summary: Elimina lógicamente una sucursal
 *     tags: [Shops]
 *     description: Realiza un borrado lógico de la sucursal estableciendo su campo `is_active` en false. No elimina físicamente la fila en base de datos para preservar la integridad de datos históricos. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único de la sucursal a eliminar.
 *     responses:
 *       200:
 *         description: Sucursal eliminada lógicamente con éxito.
 *       400:
 *         description: Error de validación (ID no es UUID válido).
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado.
 *       404:
 *         description: Sucursal no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/shops/:id', remove);

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

/**
 * @swagger
 * /api/shops/{id}/availability:
 *   get:
 *     summary: Consulta los horarios disponibles por barbero para una sucursal, fecha y servicio
 *     tags: [Shops, Availability]
 *     description: Calcula los horarios de inicio agendables por cada barbero elegible de la sucursal para un servicio específico en una fecha determinada. Endpoint público.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único de la sucursal.
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-10-15"
 *         description: Fecha a consultar en formato YYYY-MM-DD (no puede ser anterior a hoy).
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del servicio que se desea agendar.
 *     responses:
 *       200:
 *         description: Éxito. Retorna los slots de inicio disponibles agrupados por barbero.
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
 *                       barberId:
 *                         type: string
 *                         format: uuid
 *                       startTimes:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: date-time
 *                 message:
 *                   type: string
 *                   example: Available slots retrieved successfully
 *                 error:
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Error de validación (fecha inválida o pasada, serviceId faltante o inválido, id de sucursal inválido).
 *       404:
 *         description: Sucursal no encontrada/inactiva o servicio no encontrado/inactivo.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/shops/:id/availability', getAvailability);

export default router;
