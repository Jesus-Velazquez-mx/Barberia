import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { listShifts, getShift, registerShift, editShift, removeShift } from '../services/shiftService.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import type { Shift } from '../types/entities/shift.interface.js';

// Validación del ID en los parámetros de la ruta
const shiftIdParamSchema = z.object({
    id: z.uuid('Invalid shift ID format'),
});

// Hora de pared en formato 24h 'HH:MM'
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format (24h)');

// Esquema para validar los campos requeridos al crear un turno
const createShiftSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
    start_time: timeSchema,
    end_time: timeSchema,
});

// Esquema para validar la actualización, exigiendo al menos un campo a modificar
const updateShiftSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'Name must not be empty')
            .max(50, 'Name must be at most 50 characters')
            .optional(),
        start_time: timeSchema.optional(),
        end_time: timeSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    });

/**
 * Listar turnos.
 */
export const list: ApiHandler<Shift[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const result = await listShifts(token);
        sendSuccess({ res, data: result, message: 'Shifts retrieved successfully' });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};

/**
 * Obtener turno por ID.
 */
export const getById: ApiHandler<Shift> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = shiftIdParamSchema.parse({ id: req.params.id });
        const result = await getShift(validParams.id, token);
        sendSuccess({ res, data: result, message: 'Shift retrieved successfully' });
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
 * Registrar turno.
 */
export const create: ApiHandler<Shift> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validData = createShiftSchema.parse(req.body);

        const result = await registerShift(validData, token);
        sendSuccess({ res, data: result, message: 'Shift created successfully', status: 201 });
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
 * Editar turno.
 */
export const update: ApiHandler<Shift> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = shiftIdParamSchema.parse({ id: req.params.id });
        const validData = updateShiftSchema.parse(req.body);

        const result = await editShift(validParams.id, validData, token);
        sendSuccess({ res, data: result, message: 'Shift updated successfully' });
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
 * Eliminar turno.
 */
export const remove: ApiHandler<void> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = shiftIdParamSchema.parse({ id: req.params.id });

        await removeShift(validParams.id, token);
        sendSuccess({ res, message: 'Shift deleted successfully' });
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
