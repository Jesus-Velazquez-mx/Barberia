import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import {
    listServices,
    getService,
    registerService,
    editService,
    removeService,
} from '../services/serviceService.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import type { OfferedServicesResponse } from '../types/dto/offeredServiceResponse.interface.js';

const serviceIdParamSchema = z.object({
    id: z.uuid('Invalid service ID format'),
});

const serviceFilterQuerySchema = z.object({
    categoryId: z.uuid('Invalid category ID format').optional(),
    isActive: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
});

const createServiceSchema = z.object({
    categoryId: z.uuid('Invalid category ID format'),
    name: z.string().trim().min(1, 'Name is required').max(150, 'Name must be at most 150 characters'),
    description: z.string().trim().nullable().optional(),
    durationMinutes: z
        .number()
        .int('Duration must be an integer')
        .positive('Duration must be greater than 0'),
    price: z
        .number()
        .nonnegative('Price must be non-negative'),
    isActive: z.boolean().optional(),
});

const updateServiceSchema = z
    .object({
        categoryId: z.uuid('Invalid category ID format').optional(),
        name: z.string().trim().min(1, 'Name must not be empty').max(150, 'Name must be at most 150 characters').optional(),
        description: z.string().trim().nullable().optional(),
        durationMinutes: z
            .number()
            .int('Duration must be an integer')
            .positive('Duration must be greater than 0')
            .optional(),
        price: z.number().nonnegative('Price must be non-negative').optional(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    });

/**
 * Controlador para listar servicios del catálogo con filtros opcionales.
 */
export const list: ApiHandler<OfferedServicesResponse[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const queryFilters = serviceFilterQuerySchema.parse(req.query);
        const result = await listServices(queryFilters, token);
        sendSuccess({ res, data: result, message: 'Services retrieved successfully' });
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
 * Controlador para obtener los detalles de un servicio específico por ID.
 */
export const getById: ApiHandler<OfferedServicesResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = serviceIdParamSchema.parse({ id: req.params.id });
        const result = await getService(validParams.id, token);
        sendSuccess({ res, data: result, message: 'Service retrieved successfully' });
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
 * Controlador para registrar un nuevo servicio en el catálogo.
 */
export const create: ApiHandler<OfferedServicesResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validData = createServiceSchema.parse(req.body);
        const result = await registerService(validData, token);
        sendSuccess({ res, data: result, message: 'Service created successfully', status: 201 });
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
 * Controlador para actualizar un servicio existente.
 */
export const update: ApiHandler<OfferedServicesResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = serviceIdParamSchema.parse({ id: req.params.id });
        const validData = updateServiceSchema.parse(req.body);
        const result = await editService(validParams.id, validData, token);
        sendSuccess({ res, data: result, message: 'Service updated successfully' });
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
 * Controlador para realizar el borrado lógico de un servicio.
 */
export const remove: ApiHandler<void> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = serviceIdParamSchema.parse({ id: req.params.id });
        await removeService(validParams.id, token);
        sendSuccess({ res, message: 'Service deleted successfully' });
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
