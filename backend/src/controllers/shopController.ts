import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { listShops, getActiveShopById, registerShop, editShop, removeShop } from '../services/shopService.js';
import type { ShopResponse } from '../types/dto/shopResponse.interface.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';

// Validación del ID en los parámetros de la ruta
const shopIdParamSchema = z.object({
    id: z.uuid('Invalid shop ID format'),
});

const createShopFieldsSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
    street: z.string().trim().max(50, 'Street must be at most 50 characters').nullable().optional(),
    postalCode: z
        .string()
        .trim()
        .length(5, 'Postal code must be exactly 5 digits')
        .regex(/^\d{5}$/, 'Postal code must contain only numbers')
        .nullable()
        .optional(),
    number: z.string().trim().max(4, 'Number must be at most 4 characters').nullable().optional(),
    phone: z
        .string()
        .trim()
        .length(10, 'Phone must be exactly 10 digits')
        .regex(/^\d{10}$/, 'Phone must contain only numbers')
        .nullable()
        .optional(),
    managerId: z.uuid('Invalid manager ID format').optional(),
    isActive: z.boolean().optional(),
});

// Acepta datos directamente en req.body o anidados en req.body.shop
const createShopSchema = z.preprocess((val: unknown) => {
    if (val && typeof val === 'object' && 'shop' in val && typeof (val as { shop: unknown }).shop === 'object') {
        return (val as { shop: unknown }).shop;
    }
    return val;
}, createShopFieldsSchema);

const updateShopFieldsSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'Name must not be empty')
            .max(50, 'Name must be at most 50 characters')
            .optional(),
        street: z.string().trim().max(50, 'Street must be at most 50 characters').nullable().optional(),
        postalCode: z
            .string()
            .trim()
            .length(5, 'Postal code must be exactly 5 digits')
            .regex(/^\d{5}$/, 'Postal code must contain only numbers')
            .nullable()
            .optional(),
        number: z.string().trim().max(4, 'Number must be at most 4 characters').nullable().optional(),
        phone: z
            .string()
            .trim()
            .length(10, 'Phone must be exactly 10 digits')
            .regex(/^\d{10}$/, 'Phone must contain only numbers')
            .nullable()
            .optional(),
        managerId: z.uuid('Invalid manager ID format').optional(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    });

// Acepta datos directamente en req.body o anidados en req.body.shop
const updateShopSchema = z.preprocess((val: unknown) => {
    if (val && typeof val === 'object' && 'shop' in val && typeof (val as { shop: unknown }).shop === 'object') {
        return (val as { shop: unknown }).shop;
    }
    return val;
}, updateShopFieldsSchema);

/**
 * Listar sucursales
 * Por defecto lista solo las activas (para clientes).
 * Si includeInactive=true, lista todas (para administración).
 */
export const list: ApiHandler<ShopResponse[]> = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const result = await listShops(includeInactive);
        const message = includeInactive ? 'Shops retrieved successfully' : 'Active shops retrieved successfully';
        sendSuccess({ res, data: result, message });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};

/**
 * Obtener sucursal por ID.
 */
export const getById: ApiHandler<ShopResponse> = async (req, res) => {
    try {
        const validParams = shopIdParamSchema.parse({ id: req.params.id });
        const result = await getActiveShopById(validParams.id);

        sendSuccess({ res, data: result, message: 'Shop retrieved successfully' });
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
 * Registrar Sucursal.
 */
export const create: ApiHandler<ShopResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validData = createShopSchema.parse(req.body);

        const result = await registerShop(validData, token);

        sendSuccess({ res, data: result, message: 'Shop registered successfully', status: 201 });
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
 * Editar Sucursal.
 */
export const update: ApiHandler<ShopResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = shopIdParamSchema.parse({ id: req.params.id });
        const validData = updateShopSchema.parse(req.body);

        const result = await editShop(validParams.id, validData, token);

        sendSuccess({ res, data: result, message: 'Shop updated successfully' });
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
 * Eliminar Sucursal
 */
export const remove: ApiHandler<void> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = shopIdParamSchema.parse({ id: req.params.id });

        await removeShop(validParams.id, token);

        sendSuccess({ res, message: 'Shop deleted successfully' });
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
