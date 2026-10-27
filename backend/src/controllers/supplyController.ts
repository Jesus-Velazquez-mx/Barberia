import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { listSupplies, getSupply, registerSupply, editSupply, removeSupply } from '../services/supplyService.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import type { Supply } from '../types/entities/supply.interface.js';

const paramIdSchema = z.object({ id: z.uuid('Invalid supply ID format') });
const queryShopSchema = z.object({ shopId: z.uuid('Invalid shop ID').optional() });

const createSupplySchema = z.object({
    shopId: z.uuid('Invalid shop ID'),
    categoryId: z.uuid('Invalid category ID'),
    name: z.string().trim().min(1, 'Name is required').max(150, 'Name must be at most 150 characters'),
    description: z.string().trim().nullable().optional(),
    unit: z.string().trim().max(30, 'Unit must be at most 30 characters').optional(),
    sku: z.string().trim().max(50, 'SKU must be at most 50 characters').nullable().optional(),
});

const updateSupplySchema = z
    .object({
        shopId: z.uuid('Invalid shop ID').optional(),
        categoryId: z.uuid('Invalid category ID').optional(),
        name: z.string().trim().min(1, 'Name must not be empty').max(150).optional(),
        description: z.string().trim().nullable().optional(),
        unit: z.string().trim().max(30).optional(),
        sku: z.string().trim().max(50).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    });

/**
 * Listar insumos. Opcionalmente acepta ?shopId=UUID
 */
export const list: ApiHandler<Supply[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const queryParams = queryShopSchema.parse(req.query);
        const result = await listSupplies(queryParams.shopId, token);
        sendSuccess({ res, data: result, message: 'Supplies retrieved successfully' });
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            sendValidationError({ res, error });
            return;
        }
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};

/**
 * Obtener insumo por ID.
 */
export const getById: ApiHandler<Supply> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = paramIdSchema.parse({ id: req.params.id });
        const result = await getSupply(validParams.id, token);
        sendSuccess({ res, data: result, message: 'Supply retrieved successfully' });
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            sendValidationError({ res, error });
            return;
        }
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};

/**
 * Registrar insumo.
 */
export const create: ApiHandler<Supply> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validData = createSupplySchema.parse(req.body);

        const result = await registerSupply(validData, token);
        sendSuccess({ res, data: result, message: 'Supply created successfully', status: 201 });
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            sendValidationError({ res, error });
            return;
        }
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};

/**
 * Editar insumo.
 */
export const update: ApiHandler<Supply> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = paramIdSchema.parse({ id: req.params.id });
        const validData = updateSupplySchema.parse(req.body);

        const result = await editSupply(validParams.id, validData, token);
        sendSuccess({ res, data: result, message: 'Supply updated successfully' });
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            sendValidationError({ res, error });
            return;
        }
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};

/**
 * Eliminar insumo.
 */
export const remove: ApiHandler<void> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = paramIdSchema.parse({ id: req.params.id });

        await removeSupply(validParams.id, token);
        sendSuccess({ res, message: 'Supply deleted successfully' });
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            sendValidationError({ res, error });
            return;
        }
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};
