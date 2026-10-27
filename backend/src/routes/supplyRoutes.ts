import { Router } from 'express';
import { list, getById, create, update, remove } from '../controllers/supplyController.js';

const router = Router();

/**
 * @swagger
 * /api/supplies:
 *   get:
 *     summary: Obtiene la lista de insumos
 *     tags: [Supplies]
 *     description: Retorna un listado con los insumos. Permite filtrar opcionalmente por sucursal usando query parameters.
 *     parameters:
 *       - in: query
 *         name: shopId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar los insumos por ID de sucursal.
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el arreglo de insumos.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/supplies', list);

/**
 * @swagger
 * /api/supplies:
 *   post:
 *     summary: Registra un nuevo insumo
 *     tags: [Supplies]
 *     description: Crea un insumo asociándolo a una sucursal y a una categoría. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shopId, categoryId, name]
 *             properties:
 *               shopId:
 *                 type: string
 *                 format: uuid
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 maxLength: 150
 *               description:
 *                 type: string
 *                 nullable: true
 *               unit:
 *                 type: string
 *                 maxLength: 30
 *                 default: "unit"
 *               sku:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Insumo creado exitosamente.
 *       400:
 *         description: Error de validación.
 *       401:
 *         description: Token ausente o inválido.
 *       404:
 *         description: Sucursal o categoría no encontrada.
 *       409:
 *         description: Nombre de insumo o SKU ya existe en esta sucursal.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/supplies', create);

/**
 * @swagger
 * /api/supplies/{id}:
 *   get:
 *     summary: Obtiene los detalles de un insumo específico
 *     tags: [Supplies]
 *     description: Recupera la información de un insumo usando su ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Éxito.
 *       404:
 *         description: Insumo no encontrado.
 *       500:
 *         description: Error interno.
 */
router.get('/supplies/:id', getById);

/**
 * @swagger
 * /api/supplies/{id}:
 *   put:
 *     summary: Edita un insumo existente
 *     tags: [Supplies]
 *     description: Actualiza los campos de un insumo. Validará la unicidad de nombre/SKU si estos campos cambian. Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopId:
 *                 type: string
 *                 format: uuid
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               unit:
 *                 type: string
 *               sku:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Insumo actualizado.
 *       404:
 *         description: Insumo, sucursal o categoría no encontrada.
 *       409:
 *         description: Conflicto por nombre o SKU duplicado en la sucursal.
 *       500:
 *         description: Error interno.
 */
router.put('/supplies/:id', update);

/**
 * @swagger
 * /api/supplies/{id}:
 *   delete:
 *     summary: Elimina un insumo
 *     tags: [Supplies]
 *     description: Realiza el borrado físico de un insumo (las tablas dependientes como inventario tienen CASCADE en BD). Requiere token de manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Insumo eliminado con éxito.
 *       404:
 *         description: Insumo no encontrado.
 *       500:
 *         description: Error interno.
 */
router.delete('/supplies/:id', remove);

export default router;
