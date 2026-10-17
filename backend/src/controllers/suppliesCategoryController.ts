import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import {
    listCategories,
    getCategory,
    registerCategory,
    editCategory,
    removeCategory,
} from '../services/suppliesCategoryService.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import type { SupplyCategory } from '../types/entities/supplyCategory.interface.js';

// Validación del ID en los parámetros de la ruta
const categoryIdParamSchema = z.object({
    id: z.uuid('Invalid category ID format'),
});

// Esquema para validar los campos requeridos al crear una categoría
const createCategorySchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    description: z.string().trim().nullable().optional(),
});

// Esquema para validar la actualización, exigiendo al menos un campo a modificar
const updateCategorySchema = z.object({
    name: z.string().trim().min(1, 'Name must not be empty').max(100, 'Name must be at most 100 characters').optional(),
    description: z.string().trim().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});

/**
 * Listar categorías de insumos.
 */
export const list: ApiHandler<SupplyCategory[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const result = await listCategories(token);
        sendSuccess({ res, data: result, message: 'Categories retrieved successfully' });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};

/**
 * Obtener categoría por ID.
 */
export const getById: ApiHandler<SupplyCategory> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = categoryIdParamSchema.parse({ id: req.params.id });
        const result = await getCategory(validParams.id, token);
        sendSuccess({ res, data: result, message: 'Category retrieved successfully' });
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
 * Registrar Categoría.
 */
export const create: ApiHandler<SupplyCategory> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validData = createCategorySchema.parse(req.body);

        const result = await registerCategory(validData, token);
        sendSuccess({ res, data: result, message: 'Category created successfully', status: 201 });
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
 * Editar Categoría.
 */
export const update: ApiHandler<SupplyCategory> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = categoryIdParamSchema.parse({ id: req.params.id });
        const validData = updateCategorySchema.parse(req.body);

        const result = await editCategory(validParams.id, validData, token);
        sendSuccess({ res, data: result, message: 'Category updated successfully' });
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
 * Eliminar Categoría.
 */
export const remove: ApiHandler<void> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = categoryIdParamSchema.parse({ id: req.params.id });

        await removeCategory(validParams.id, token);
        sendSuccess({ res, message: 'Category deleted successfully' });
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