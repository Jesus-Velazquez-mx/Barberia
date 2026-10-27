import { z, ZodError } from 'zod';
import type { ReceptionistDetailResponse } from '../types/dto/receptionistResponse.interface.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import {
    registerReceptionist,
    getReceptionistDetails,
    listReceptionistsByShop,
    updateReceptionist,
    deleteReceptionist,
} from '../services/receptionistService.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';

const receptionistIdParamSchema = z.object({
    id: z.uuid('Invalid ID format'),
});

const getReceptionistsByShopSchema = z.object({
    id: z.uuid('Invalid shop ID format'),
});

const createReceptionistSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    email: z.string().trim().email('Invalid email format').max(255),
    phone: z.string().trim().max(10).optional().nullable(),
    birthDate: z.coerce.date(),
    gender: z.string().max(10),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    shopId: z.uuid('Invalid shop ID'),
    shiftId: z.uuid('Invalid shift ID'),
});

// La sucursal, el turno y la contraseña no se modifican desde este endpoint
const updateReceptionistSchema = z
    .object({
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().min(1).max(100).optional(),
        email: z.string().trim().email('Invalid email format').max(255).optional(),
        phone: z.string().trim().max(10).optional(),
        birthDate: z.coerce.date().optional(),
        gender: z.string().max(10).optional(),
    })
    .refine(
        (data) => {
            for (const value of Object.values(data)) {
                if (value !== undefined) return true;
            }
            return false;
        },
        {
            message: 'At least one field must be provided',
        }
    );

export const getById: ApiHandler<ReceptionistDetailResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = receptionistIdParamSchema.parse({ id: req.params.id });

        const result = await getReceptionistDetails(validParams.id, token);
        sendSuccess({ res, data: result, message: 'Receptionist retrieved successfully' });
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

export const listByShop: ApiHandler<ReceptionistDetailResponse[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = getReceptionistsByShopSchema.parse({ id: req.params.id });
        const includeInactive = req.query.includeInactive === 'true';

        const result = await listReceptionistsByShop(validParams.id, token, includeInactive);
        sendSuccess({ res, data: result, message: 'Receptionists retrieved successfully' });
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

export const create: ApiHandler<ReceptionistDetailResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validData = createReceptionistSchema.parse(req.body);

        const result = await registerReceptionist(validData, token);
        sendSuccess({ res, data: result, message: 'Receptionist created successfully', status: 201 });
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

export const update: ApiHandler<ReceptionistDetailResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = receptionistIdParamSchema.parse({ id: req.params.id });
        const validData = updateReceptionistSchema.parse(req.body);

        const result = await updateReceptionist({ id: validParams.id, ...validData }, token);
        sendSuccess({ res, data: result, message: 'Receptionist updated successfully' });
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

export const remove: ApiHandler<void> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = receptionistIdParamSchema.parse({ id: req.params.id });

        await deleteReceptionist(validParams.id, token);
        sendSuccess({ res, message: 'Receptionist deleted successfully' });
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
