import { Router } from 'express';
import { create, getById, list, listFacialStructureTypes, remove, update } from '../controllers/styleController.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FacialStructure:
 *       type: string
 *       enum: [oval, triangle, heart, round, diamond, square, rectangle]
 *     HaircutStyle:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, example: Wolf Cut }
 *         description: { type: string, nullable: true, example: Capas desfiladas con volumen en la coronilla. }
 *         isActive: { type: boolean, example: true }
 *         facialStructures:
 *           type: array
 *           items: { $ref: '#/components/schemas/FacialStructure' }
 *           example: [oval, square]
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /api/haircuts:
 *   get:
 *     summary: Lista los estilos de corte
 *     tags: [Haircut Styles]
 *     description: >-
 *       Devuelve el catálogo de estilos de corte (activos e inactivos), ordenado por nombre. Solo para managers.
 *       Un arreglo vacío indica que el catálogo está vacío o que ningún estilo coincide con la búsqueda.
 *       La foto de cada estilo se obtiene con `GET /api/haircuts/{haircutId}/image-url`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 150 }
 *         description: Texto a buscar en el nombre o la descripción (sin distinguir mayúsculas).
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *         description: Filtra por estado. Si se omite, se devuelven todos.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de estilos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/HaircutStyle' }
 *                 message: { type: string, example: Haircut styles retrieved successfully }
 *       400:
 *         description: Parámetros de búsqueda inválidos.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: La cuenta está desactivada o el usuario no es manager.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/haircuts', list);

/**
 * @swagger
 * /api/haircuts/facial-structures:
 *   get:
 *     summary: Lista las estructuras faciales válidas
 *     tags: [Haircut Styles]
 *     description: Devuelve los valores del enum `facial_structure_type` de la base de datos. Solo para managers.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FacialStructure' }
 *                 message: { type: string, example: Facial structures retrieved successfully }
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: La cuenta está desactivada o el usuario no es manager.
 */
router.get('/haircuts/facial-structures', listFacialStructureTypes);

/**
 * @swagger
 * /api/haircuts:
 *   post:
 *     summary: Registra un estilo de corte
 *     tags: [Haircut Styles]
 *     description: >-
 *       Registra un estilo activo. Solo para managers. El nombre no puede coincidir con el de otro estilo
 *       (activo o inactivo) al convertirlo a snake_case; es decir, se ignoran mayúsculas, acentos y signos
 *       ("Wolf Cut" y "wolf-cut" se consideran el mismo).
 *
 *       La foto es opcional y se sube después de registrar el estilo: se pide un formulario con
 *       `GET /api/presigned-url?target=haircut&haircutId={id}&contentType=...` y se envía a S3.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, facialStructures]
 *             properties:
 *               name: { type: string, maxLength: 150, example: Wolf Cut }
 *               description: { type: string, nullable: true, example: Capas desfiladas con volumen en la coronilla. }
 *               facialStructures:
 *                 type: array
 *                 minItems: 1
 *                 uniqueItems: true
 *                 items: { $ref: '#/components/schemas/FacialStructure' }
 *                 example: [oval, square]
 *     responses:
 *       201:
 *         description: Estilo registrado. `data` contiene el estilo creado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/HaircutStyle' }
 *                 message: { type: string, example: Haircut style created successfully }
 *       400:
 *         description: Faltan campos requeridos o alguno es inválido (por ejemplo, una estructura facial que no existe).
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: La cuenta está desactivada o el usuario no es manager.
 *       409:
 *         description: Ya existe un estilo con ese nombre.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/haircuts', create);

/**
 * @swagger
 * /api/haircuts/{id}:
 *   get:
 *     summary: Obtiene un estilo de corte por ID
 *     tags: [Haircut Styles]
 *     description: Solo para managers.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Estilo encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/HaircutStyle' }
 *                 message: { type: string, example: Haircut style retrieved successfully }
 *       400:
 *         description: Formato de ID inválido.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: La cuenta está desactivada o el usuario no es manager.
 *       404:
 *         description: Estilo no encontrado.
 */
router.get('/haircuts/:id', getById);

/**
 * @swagger
 * /api/haircuts/{id}:
 *   put:
 *     summary: Actualiza un estilo de corte
 *     tags: [Haircut Styles]
 *     description: >-
 *       Actualiza los campos enviados (al menos uno). Solo para managers. Si se envía `facialStructures`,
 *       reemplaza por completo las estructuras actuales. `isActive: true` reactiva un estilo dado de baja.
 *
 *       Si el nombre cambia, la foto del estilo se mueve en el bucket a la key del nombre nuevo. Si S3 falla,
 *       el cambio no se guarda y se responde 502 (credenciales) o 500.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name: { type: string, maxLength: 150 }
 *               description: { type: string, nullable: true }
 *               facialStructures:
 *                 type: array
 *                 minItems: 1
 *                 uniqueItems: true
 *                 items: { $ref: '#/components/schemas/FacialStructure' }
 *               isActive: { type: boolean }
 *           example:
 *             name: Wolf Cut Largo
 *             facialStructures: [oval, heart]
 *             isActive: true
 *     responses:
 *       200:
 *         description: Estilo actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/HaircutStyle' }
 *                 message: { type: string, example: Haircut style updated successfully }
 *       400:
 *         description: Formato de ID inválido, cuerpo vacío o campos inválidos.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: La cuenta está desactivada o el usuario no es manager.
 *       404:
 *         description: Estilo no encontrado.
 *       409:
 *         description: El nombre ya pertenece a otro estilo.
 *       502:
 *         description: No se pudieron resolver las credenciales de AWS al mover la foto.
 */
router.put('/haircuts/:id', update);

/**
 * @swagger
 * /api/haircuts/{id}:
 *   delete:
 *     summary: Da de baja un estilo de corte
 *     tags: [Haircut Styles]
 *     description: >-
 *       Borrado lógico: el estilo queda inactivo (deja de usarse en las recomendaciones) y puede reactivarse
 *       con `PUT /api/haircuts/{id}`. Es idempotente. Solo para managers.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Estilo dado de baja.
 *       400:
 *         description: Formato de ID inválido.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: La cuenta está desactivada o el usuario no es manager.
 *       404:
 *         description: Estilo no encontrado.
 */
router.delete('/haircuts/:id', remove);

export default router;
