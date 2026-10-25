import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import {
    listAllServices,
    getOfferedServiceById,
    registerService,
    editService,
    removeService,
} from '../services/offeredServiceService.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import type { OfferedServicesResponse } from '../types/dto/offeredServiceResponse.interface.js';

// Valida que el ID de los parámetros de ruta cumpla con el formato UUID
const serviceIdParamsSchema = z.object({
    id: z.uuid('Invalid service ID format'),
});

// Valida los filtros opcionales recibidos por la consulta (Query String)
const serviceFilterQuerySchema = z.object({
    categoryId: z.uuid('Invalid category ID format').optional(),
});

// Valida el cuerpo de la petición HTTP al crear un nuevo servicio
const createServiceSchema = z.object({
    categoryId: z.uuid('Invalid category ID format'),
    name: z.string().trim().min(1, 'Name is required').max(150, 'Name must be at most 150 characters'),
    description: z.string().trim().nullable().optional(),
    durationMinutes: z.number().int('Duration must be an integer').positive('Duration must be greater than 0'),
    price: z.number().nonnegative('Price must be non-negative'),
    isActive: z.boolean().optional(),
});

// Valida el cuerpo de la petición HTTP al actualizar un servicio (campos opcionales, exige al menos uno)
const updateServiceSchema = z
    .object({
        categoryId: z.uuid('Invalid category ID format').optional(),
        name: z
            .string()
            .trim()
            .min(1, 'Name must not be empty')
            .max(150, 'Name must be at most 150 characters')
            .optional(),
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
 * Controlador para listar todos los servicios del catálogo.
 * Soporta filtrado opcional por categoría y discriminación de visibilidad basada en roles.
 */
export const listAll: ApiHandler<OfferedServicesResponse[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const queryFilters = serviceFilterQuerySchema.parse(req.query);

        const result = await listAllServices(token, queryFilters.categoryId);
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
 * Controlador para obtener el detalle de un servicio por su ID.
 * Valida el UUID y oculta los servicios inactivos si el usuario es un cliente.
 */
export const getById: ApiHandler<OfferedServicesResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = serviceIdParamsSchema.parse({ id: req.params.id });

        const result = await getOfferedServiceById(validParams.id, token);
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
 * Restringido exclusivamente a usuarios con rol de manager.
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
 * Restringido exclusivamente a usuarios con rol de manager.
 */
export const update: ApiHandler<OfferedServicesResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = serviceIdParamsSchema.parse({ id: req.params.id });
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
 * Controlador para realizar el borrado lógico (inactivación) de un servicio.
 * Restringido exclusivamente a usuarios con rol de manager.
 */
export const remove: ApiHandler<void> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = serviceIdParamsSchema.parse({ id: req.params.id });

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
