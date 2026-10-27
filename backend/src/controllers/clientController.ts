import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendFail, sendValidationError, sendInternalServerError } from '../utils/apiResponse.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    registerClient,
    listClients,
    getClientDetails,
    searchClients,
    updateClient,
    deleteClient,
} from '../services/clientService.js';
import type { ClientDetailResponse } from '../types/dto/clientResponse.interface.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';

const clientIdParamSchema = z.object({
    id: z.uuid('Invalid client ID format'),
});

const createClientSchema = z.object({
    firstName: z.string().trim().min(2, 'First name must have at least 2 characters').max(100),
    lastName: z.string().trim().min(2, 'Last name must have at least 2 characters').max(100),
    email: z.email('Invalid email format').trim().max(255),
    phone: z.string().trim().length(10, 'Phone must have 10 digits').optional().nullable(),
    password: z.string().min(6, 'Password must have at least 6 characters'),
    birthDate: z.coerce.date(),
    gender: z.string().trim().min(1).max(10),
    facialStructureType: z
        .enum(['oval', 'triangle', 'heart', 'round', 'diamond', 'square', 'rectangle'])
        .optional()
        .nullable(),
    completedServicesCount: z.number().int().min(0).optional(),
});

const updateClientFieldsSchema = z.object({
    id: z.uuid().optional(),
    email: z.email('Invalid email format').max(255).optional(),
    phone: z.string().trim().length(10, 'Phone must have 10 digits').optional().nullable(),
    password: z.string().min(6, 'Password must have at least 6 characters').optional(),
    firstName: z.string().trim().min(2).max(100).optional(),
    lastName: z.string().trim().min(2).max(100).optional(),
    birthDate: z.coerce.date().optional(),
    gender: z.string().trim().min(1).max(10).optional(),
    facialStructureType: z
        .enum(['oval', 'triangle', 'heart', 'round', 'diamond', 'square', 'rectangle'])
        .optional()
        .nullable(),
    completedServicesCount: z.number().int().min(0).optional(),
});

/**
 * Registra un nuevo cliente.
 */
export const create: ApiHandler<ClientDetailResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validData = createClientSchema.parse(req.body);

        const result = await registerClient(validData, token);
        sendSuccess({ res, data: result, message: 'Client created successfully', status: 201 });
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
 * Obtiene la lista completa de clientes. Con ?q= filtra por coincidencia parcial en nombre, apellido o correo.
 */
export const list: ApiHandler<ClientDetailResponse[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);

        const term = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        if (term.length > 0) {
            const result = await searchClients(term, token);
            sendSuccess({ res, data: result, message: 'Clients retrieved successfully' });
            return;
        }

        const result = await listClients(token);
        sendSuccess({ res, data: result, message: 'Clients retrieved successfully' });
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
 * Obtiene el detalle de un cliente por su ID.
 */
export const getById: ApiHandler<ClientDetailResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = clientIdParamSchema.parse({ id: req.params.id });

        const result = await getClientDetails(validParams.id, token);
        sendSuccess({ res, data: result, message: 'Client retrieved successfully' });
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
 * Actualiza la información de un cliente.
 * Soporta recibir el ID en req.params.id o en el body (req.body.id o req.body.client.id).
 */
export const update: ApiHandler<ClientDetailResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);

        // Extrae el ID de params o de body
        const rawBody = req.body.client ? req.body.client : req.body;
        const targetId = req.params.id || rawBody?.id;

        if (!targetId) {
            throw new ApiError(ApiErrorCode.BAD_REQUEST, 'Client ID is required');
        }

        const validId = z.uuid('Invalid client ID format').parse(targetId);
        const validData = updateClientFieldsSchema.parse(rawBody);

        // Asegura que al menos un campo se esté actualizando (excluyendo id)
        const { id: _ignoredId, ...fieldsToUpdate } = validData;
        const hasFields = Object.values(fieldsToUpdate).some((val) => val !== undefined);
        if (!hasFields) {
            throw new ApiError(ApiErrorCode.BAD_REQUEST, 'At least one field must be provided for update');
        }

        const result = await updateClient({ id: validId, ...fieldsToUpdate }, token);
        sendSuccess({ res, data: result, message: 'Client updated successfully' });
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
 * Elimina físicamente a un cliente por su ID.
 */
export const remove: ApiHandler<void> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = clientIdParamSchema.parse({ id: req.params.id });

        await deleteClient(validParams.id, token);
        sendSuccess({ res, message: 'Client deleted successfully' });
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
