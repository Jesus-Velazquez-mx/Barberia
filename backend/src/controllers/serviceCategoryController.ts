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
} from '../services/serviceCategoryService.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import type { ServiceCategory } from '../types/entities/serviceCategory.interface.js';

const categoryIdParamSchema = z.object({
    id: z.uuid('Invalid category ID format'),
});

const createCategorySchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    description: z.string().trim().nullable().optional(),
});

const updateCategorySchema = z
    .object({
        name: z.string().trim().min(1, 'Name must not be empty').max(100, 'Name must be at most 100 characters').optional(),
        description: z.string().trim().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    });

/**
 * Controlador para listar todas las categorías de servicios.
 */
export const list: ApiHandler<ServiceCategory[]> = async (req, res) => {
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
 * Controlador para obtener los detalles de una categoría de servicios por ID.
 */
export const getById: ApiHandler<ServiceCategory> = async (req, res) => {
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
 * Controlador para registrar una nueva categoría de servicios.
 */
export const create: ApiHandler<ServiceCategory> = async (req, res) => {
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
 * Controlador para editar una categoría de servicios existente.
 */
export const update: ApiHandler<ServiceCategory> = async (req, res) => {
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
 * Controlador para eliminar una categoría de servicios.
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
