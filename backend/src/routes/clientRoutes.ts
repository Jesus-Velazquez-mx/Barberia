import { Router } from 'express';
import { create, list, getById, update, remove } from '../controllers/clientController.js';


const router = Router();

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Obtiene la lista completa de clientes o busca por coincidencia parcial (?q=)
 *     tags: [Clients]
 *     description: Retorna todos los clientes registrados en el sistema. Con ?q= filtra por coincidencia parcial (sin distinguir mayúsculas) en nombre, apellido o correo, con un máximo de 20 resultados. Requiere token de personal (manager o receptionist).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Texto parcial a buscar en nombre, apellido o correo.
 *     responses:
 *       200:
 *         description: Éxito. Retorna el arreglo de clientes.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado. Solo el personal puede listar o buscar clientes.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/clients', list);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Obtiene el detalle de un cliente por su ID
 *     tags: [Clients]
 *     description: Retorna la información completa de un cliente. Los clientes solo pueden consultar su propio perfil; el personal puede consultar cualquier cliente.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del cliente.
 *     responses:
 *       200:
 *         description: Éxito. Datos del cliente.
 *       400:
 *         description: ID con formato inválido.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado para consultar este cliente.
 *       404:
 *         description: Cliente no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/clients/:id', getById)

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Registra un nuevo cliente
 *     tags: [Clients]
 *     description: Crea un nuevo cliente manipulando las tablas `users` y `clients` en una transacción. Si se proporciona token, solo personal (manager/receptionist) puede registrar clientes. Sin token, se permite auto-registro.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, birthDate, gender]
 *             properties:
 *               firstName: { type: string, example: Juan }
 *               lastName: { type: string, example: Pérez }
 *               email: { type: string, format: email, example: juan.perez@example.com }
 *               password: { type: string, minLength: 6, example: password123 }
 *               phone: { type: string, minLength: 10, maxLength: 10, nullable: true, example: "3312345678" }
 *               birthDate: { type: string, format: date, example: "1995-05-15" }
 *               gender: { type: string, example: male }
 *               facialStructureType: { type: string, enum: [oval, triangle, heart, round, diamond, square, rectangle], nullable: true }
 *               completedServicesCount: { type: integer, example: 0 }
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente.
 *       400:
 *         description: Error de validación en los datos enviados.
 *       403:
 *         description: Prohibido. Los clientes no pueden registrar a otros clientes.
 *       409:
 *         description: El email o teléfono ya están registrados.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/clients', create);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Actualiza los datos de un cliente
 *     tags: [Clients]
 *     description: Actualiza los campos especificados de un cliente en `users` y/o `clients`. Los clientes solo pueden actualizar su propio perfil y no pueden alterar `completedServicesCount`. El personal puede actualizar cualquier cliente.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del cliente a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string, minLength: 10, maxLength: 10, nullable: true }
 *               password: { type: string, minLength: 6 }
 *               birthDate: { type: string, format: date }
 *               gender: { type: string }
 *               facialStructureType: { type: string, enum: [oval, triangle, heart, round, diamond, square, rectangle], nullable: true }
 *               completedServicesCount: { type: integer }
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente.
 *       400:
 *         description: Error de validación o ningún campo proporcionado.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado.
 *       404:
 *         description: Cliente no encontrado.
 *       409:
 *         description: El nuevo email o teléfono ya están en uso.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/clients/:id', update);
router.put('/clients', update);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Elimina físicamente a un cliente
 *     tags: [Clients]
 *     description: Elimina el registro del cliente tanto de `clients` como de `users` en una transacción atómica. Un cliente puede eliminar su propia cuenta, y los managers pueden eliminar cualquier cuenta de cliente.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del cliente a eliminar.
 *     responses:
 *       200:
 *         description: Cliente eliminado exitosamente.
 *       400:
 *         description: ID con formato inválido.
 *       401:
 *         description: Token ausente o inválido.
 *       403:
 *         description: No autorizado para eliminar este cliente.
 *       404:
 *         description: Cliente no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/clients/:id', remove);

export default router;
