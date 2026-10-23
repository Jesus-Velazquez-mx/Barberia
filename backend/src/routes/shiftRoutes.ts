import { Router } from 'express';
import { list, getById, create, update, remove } from '../controllers/shiftController.js';

const router = Router();

/**
 * @swagger
 * /api/shifts:
 *   get:
 *     summary: Obtiene la lista de turnos
 *     tags: [Shifts]
 *     description: Retorna todos los turnos ordenados por hora de inicio. Solo personal (manager o receptionist). Requiere token JWT en el header `Authorization`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de turnos.
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
 *                       name: { type: string, example: morning }
 *                       start_time: { type: string, example: "08:00:00" }
 *                       end_time: { type: string, example: "16:00:00" }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *                 message: { type: string, example: Shifts retrieved successfully }
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: El usuario no es personal (manager o receptionist) o su cuenta está desactivada.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/shifts', list);

/**
 * @swagger
 * /api/shifts:
 *   post:
 *     summary: Registra un nuevo turno
 *     tags: [Shifts]
 *     description: Solo managers. El turno debe durar exactamente 4, 6 u 8 horas. Se permiten turnos que se traslapan, pero no dos con el mismo horario exacto ni con el mismo nombre.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, start_time, end_time]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: "midday"
 *               start_time:
 *                 type: string
 *                 description: Hora de inicio en formato HH:MM (24h).
 *                 example: "10:00"
 *               end_time:
 *                 type: string
 *                 description: Hora de fin en formato HH:MM (24h).
 *                 example: "18:00"
 *     responses:
 *       201:
 *         description: Turno creado exitosamente.
 *       400:
 *         description: Error de validación en los campos proporcionados.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: El usuario no es manager o su cuenta está desactivada.
 *       409:
 *         description: El nombre o el horario exacto ya pertenecen a otro turno.
 *       422:
 *         description: El fin no es posterior al inicio, o la duración no es de 4, 6 u 8 horas.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/shifts', create);

/**
 * @swagger
 * /api/shifts/{id}:
 *   get:
 *     summary: Obtiene los detalles de un turno
 *     tags: [Shifts]
 *     description: Solo personal (manager o receptionist).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del turno.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el turno.
 *       400:
 *         description: El ID no es un UUID válido.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado.
 *       404:
 *         description: Turno no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/shifts/:id', getById);

/**
 * @swagger
 * /api/shifts/{id}:
 *   put:
 *     summary: Edita un turno existente
 *     tags: [Shifts]
 *     description: Solo managers. Actualización parcial; las reglas de duración (4, 6 u 8 horas) y de horario duplicado se validan sobre los valores resultantes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del turno a editar.
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
 *               start_time:
 *                 type: string
 *                 example: "10:00"
 *               end_time:
 *                 type: string
 *                 example: "14:00"
 *     responses:
 *       200:
 *         description: Turno actualizado correctamente.
 *       400:
 *         description: Error de validación o ningún campo proporcionado.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado.
 *       404:
 *         description: Turno no encontrado.
 *       409:
 *         description: El nombre o el horario exacto ya pertenecen a otro turno.
 *       422:
 *         description: El fin no es posterior al inicio, o la duración no es de 4, 6 u 8 horas.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/shifts/:id', update);

/**
 * @swagger
 * /api/shifts/{id}:
 *   delete:
 *     summary: Elimina un turno
 *     tags: [Shifts]
 *     description: Solo managers. Borrado físico. Se bloquea si es el único turno existente (hay que crear otro antes) o si tiene barberos o recepcionistas asignados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del turno a eliminar.
 *     responses:
 *       200:
 *         description: Turno eliminado con éxito.
 *       400:
 *         description: El ID no es un UUID válido.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado.
 *       404:
 *         description: Turno no encontrado.
 *       409:
 *         description: Es el único turno existente o tiene personal asignado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/shifts/:id', remove);

export default router;
