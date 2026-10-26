import { Router } from 'express';
import { getById, create, update, remove } from '../controllers/receptionistController.js';

const router = Router();

/**
 * @swagger
 * /api/receptionists/{id}:
 *   get:
 *     summary: Obtiene el detalle de un recepcionista
 *     tags: [Receptionists]
 *     security:
 *       - bearerAuth: []
 *     description: Retorna el perfil completo de un recepcionista (incluido si está dado de baja). Requiere rol de 'manager' y que el recepcionista pertenezca a una sucursal que el gerente administra.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de usuario del recepcionista a consultar.
 *     responses:
 *       200:
 *         description: Recepcionista encontrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: string, format: uuid }
 *                     shopId: { type: string, format: uuid }
 *                     shiftId: { type: string, format: uuid }
 *                     firstName: { type: string, example: "Misato" }
 *                     lastName: { type: string, example: "Katsuragi" }
 *                     email: { type: string, format: email, example: "misato@barberia.com" }
 *                     phone: { type: string, nullable: true, example: "5551234567" }
 *                     birthDate: { type: string, format: date-time }
 *                     gender: { type: string, example: "female" }
 *                     deletedAt: { type: string, format: date-time, nullable: true, example: null }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *                 message: { type: string, example: Receptionist retrieved successfully }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       400:
 *         description: El formato del ID proporcionado no es un UUID válido.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un manager puede consultar recepcionistas y únicamente los de sus sucursales.
 *       404:
 *         description: No se encontró el recepcionista solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/receptionists/:id', getById);

/**
 * @swagger
 * /api/receptionists:
 *   post:
 *     summary: Registra o reactiva un recepcionista
 *     tags: [Receptionists]
 *     security:
 *       - bearerAuth: []
 *     description: Crea la cuenta de un recepcionista asignado a una sucursal y un turno. Si el correo pertenece a un recepcionista dado de baja, se reactiva (conservando su ID) con los nuevos datos, contraseña, sucursal y turno. Requiere rol de 'manager' y que la sucursal sea una que el gerente administra.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - birthDate
 *               - gender
 *               - password
 *               - shopId
 *               - shiftId
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Misato"
 *               lastName:
 *                 type: string
 *                 example: "Katsuragi"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "misato@barberia.com"
 *               phone:
 *                 type: string
 *                 example: "5559876543"
 *               birthDate:
 *                 type: string
 *                 example: "1992-05-15"
 *               gender:
 *                 type: string
 *                 example: "female"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "secret123"
 *               shopId:
 *                 type: string
 *                 format: uuid
 *                 example: "660e8400-e29b-41d4-a716-446655440111"
 *               shiftId:
 *                 type: string
 *                 format: uuid
 *                 example: "770e8400-e29b-41d4-a716-446655440222"
 *     responses:
 *       201:
 *         description: Recepcionista registrado o reactivado exitosamente.
 *       400:
 *         description: Error de validación en los datos enviados.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un manager puede registrar recepcionistas y únicamente en sus sucursales.
 *       404:
 *         description: La sucursal o el turno indicados no existen.
 *       409:
 *         description: Conflicto. El correo pertenece a otro usuario o a un recepcionista activo, o el teléfono ya está en uso.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/receptionists', create);

/**
 * @swagger
 * /api/receptionists/{id}:
 *   put:
 *     summary: Actualiza los datos personales de un recepcionista
 *     tags: [Receptionists]
 *     security:
 *       - bearerAuth: []
 *     description: Modifica los datos personales de un recepcionista. Al menos un campo debe ser enviado. Requiere rol de 'manager' y que el recepcionista pertenezca a una sucursal que el gerente administra. (El cambio de sucursal o turno se maneja en un endpoint independiente).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de usuario del recepcionista a modificar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Misato"
 *               lastName:
 *                 type: string
 *                 example: "Katsuragi"
 *               email:
 *                 type: string
 *                 example: "misato2@barberia.com"
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *               birthDate:
 *                 type: string
 *                 example: "1992-05-15"
 *               gender:
 *                 type: string
 *                 example: "female"
 *     responses:
 *       200:
 *         description: Recepcionista actualizado exitosamente.
 *       400:
 *         description: Error de validación (ej. ID inválido o cuerpo de petición vacío).
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un manager puede editar recepcionistas y únicamente los de sus sucursales.
 *       404:
 *         description: No se encontró el recepcionista a actualizar.
 *       409:
 *         description: El correo o teléfono ya pertenece a otro usuario, o el recepcionista está dado de baja y requiere reactivación.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/receptionists/:id', update);

/**
 * @swagger
 * /api/receptionists/{id}:
 *   delete:
 *     summary: Borrado lógico de un recepcionista (Baja)
 *     tags: [Receptionists]
 *     security:
 *       - bearerAuth: []
 *     description: Da de baja a un recepcionista registrando el timestamp en `deleted_at`; deja de poder iniciar sesión. Puede reactivarse registrándolo de nuevo con el mismo correo. Requiere rol de 'manager' y que el recepcionista pertenezca a una sucursal que el gerente administra.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de usuario del recepcionista a dar de baja.
 *     responses:
 *       200:
 *         description: Recepcionista dado de baja exitosamente.
 *       400:
 *         description: El formato del ID proporcionado no es válido.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido. Solo un manager puede eliminar recepcionistas y únicamente los de sus sucursales.
 *       404:
 *         description: No se encontró el recepcionista a eliminar.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/receptionists/:id', remove);

export default router;
