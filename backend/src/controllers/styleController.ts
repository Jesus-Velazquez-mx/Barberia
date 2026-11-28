import type { Response } from 'express';
import { z, ZodError } from 'zod';
import { CredentialsProviderError } from '@smithy/property-provider';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    type ApiHandler,
    sendFail,
    sendInternalServerError,
    sendSuccess,
    sendValidationError,
} from '../utils/apiResponse.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import {
    editStyle,
    getStyle,
    listFacialStructures,
    listStyles,
    registerStyle,
    removeStyle,
} from '../services/styleService.js';
import type { HaircutStyleResponse } from '../types/dto/haircutStyleResponse.interface.js';
import type { FacialStructureType } from '../types/entities/client.interface.js';

/* Espejo del enum facial_structure_type de init_database.sql. */
const FACIAL_STRUCTURES = ['oval', 'triangle', 'heart', 'round', 'diamond', 'square', 'rectangle'] as const;

const styleIdParamSchema = z.object({
    id: z.uuid('Invalid haircut style ID format'),
});

const nameSchema = z.string().trim().min(1, 'Name is required').max(150, 'Name must be at most 150 characters');

const descriptionSchema = z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) => (value ? value : null));

const facialStructuresSchema = z
    .array(z.enum(FACIAL_STRUCTURES, 'Invalid facial structure'), 'Facial structures are required')
    .min(1, 'At least one facial structure is required')
    .refine((values) => new Set(values).size === values.length, 'Facial structures must not be repeated');

const createStyleSchema = z.object({
    name: nameSchema,
    description: descriptionSchema,
    facialStructures: facialStructuresSchema,
});

const updateStyleSchema = z
    .object({
        name: nameSchema.optional(),
        description: z
            .string()
            .trim()
            .nullable()
            .optional()
            .transform((value) => (value === undefined ? undefined : value || null)),
        facialStructures: facialStructuresSchema.optional(),
        isActive: z.boolean('isActive must be a boolean').optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: 'At least one field must be provided for update',
    });

const listQuerySchema = z.object({
    search: z.string().trim().max(150, 'Search must be at most 150 characters').optional(),
    status: z.enum(['active', 'inactive'], 'Status must be "active" or "inactive"').optional(),
});

const handleStyleError = (res: Response, error: unknown): void => {
    if (error instanceof ZodError) {
        sendValidationError({ res, error });
        return;
    }

    if (error instanceof ApiError) {
        sendFail({ res, message: error.message, status: error.code });
        return;
    }

    if (error instanceof CredentialsProviderError) {
        sendFail({ res, message: 'AWS credentials could not be resolved', status: ApiErrorCode.BAD_GATEWAY });
        return;
    }

    sendInternalServerError({ res, error: [String(error)] });
};

/**
 * Lista los estilos de corte. Acepta ?search= (nombre o descripción) y ?status=active|inactive.
 */
export const list: ApiHandler<HaircutStyleResponse[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const { search, status } = listQuerySchema.parse(req.query);
        const styles = await listStyles(
            { search: search || undefined, isActive: status === undefined ? undefined : status === 'active' },
            token
        );
        sendSuccess({ res, data: styles, message: 'Haircut styles retrieved successfully' });
    } catch (error) {
        handleStyleError(res, error);
    }
};

/**
 * Lista las estructuras faciales válidas (enum de la base de datos).
 */
export const listFacialStructureTypes: ApiHandler<FacialStructureType[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const structures = await listFacialStructures(token);
        sendSuccess({ res, data: structures, message: 'Facial structures retrieved successfully' });
    } catch (error) {
        handleStyleError(res, error);
    }
};

/**
 * Obtiene un estilo de corte por su ID.
 */
export const getById: ApiHandler<HaircutStyleResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const { id } = styleIdParamSchema.parse({ id: req.params.id });
        const style = await getStyle(id, token);
        sendSuccess({ res, data: style, message: 'Haircut style retrieved successfully' });
    } catch (error) {
        handleStyleError(res, error);
    }
};

/**
 * Registra un estilo de corte.
 */
export const create: ApiHandler<HaircutStyleResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const data = createStyleSchema.parse(req.body);
        const style = await registerStyle(data, token);
        sendSuccess({ res, data: style, message: 'Haircut style created successfully', status: 201 });
    } catch (error) {
        handleStyleError(res, error);
    }
};

/**
 * Actualiza un estilo de corte.
 */
export const update: ApiHandler<HaircutStyleResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const { id } = styleIdParamSchema.parse({ id: req.params.id });
        const data = updateStyleSchema.parse(req.body);
        const style = await editStyle(id, data, token);
        sendSuccess({ res, data: style, message: 'Haircut style updated successfully' });
    } catch (error) {
        handleStyleError(res, error);
    }
};

/**
 * Da de baja (borrado lógico) un estilo de corte.
 */
export const remove: ApiHandler<void> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const { id } = styleIdParamSchema.parse({ id: req.params.id });
        await removeStyle(id, token);
        sendSuccess({ res, message: 'Haircut style deleted successfully' });
    } catch (error) {
        handleStyleError(res, error);
    }
};
