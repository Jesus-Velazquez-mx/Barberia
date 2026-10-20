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


// Valida que el ID en los parámetros de la ruta sea un UUID válido
const categoryIdParamSchema = z.object({
    id: z.uuid('Invalid category ID format'),
});

// Valida los datos requeridos para registrar una nueva categoría de servicio
const createCategorySchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    description: z.string().trim().nullable().optional(),
    isActive: z.boolean().optional(),
});

// Valida los datos opcionales para actualizar una categoría, exigiendo al menos un campo
const updateCategorySchema = z.object({
    name: z.string().trim().min(1, 'Name must not be empty').max(100, 'Name must be at most 100 characters').optional(),
    description: z.string().trim().nullable().optional(),
    isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});

/**
 * Controlador para listar las categorías de servicios disponibles.
 * Extrae el token de autorización y delega al servicio el filtrado por roles.
 */
export const list: ApiHandler<any> = async (req, res) => {
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
 * Controlador para obtener los detalles de una categoría específica por su ID.
 * Valida el formato UUID del parámetro y aplica reglas de visibilidad por rol.
 */
export const getById: ApiHandler<any> = async (req, res) => {
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
export const create: ApiHandler<any> = async (req, res) => {
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
 * Controlador para actualizar una categoría de servicios existente.
 * Si se inactiva (isActive = false), desencadena la desactivación en cascada de sus servicios.
 */
export const update: ApiHandler<any> = async (req, res) => {
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
 * Previene la eliminación si existen servicios asignados por integridad referencial.
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