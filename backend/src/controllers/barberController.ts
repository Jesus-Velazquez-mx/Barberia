import { z, ZodError } from 'zod';
import type { BarberResponse, PublicBarberResponse } from '../types/dto/barberResponse.interface.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import {
    updateBarber,
    deleteBarber,
    listBarbersByShop,
    registerBarber,
    getBarberDetails,
} from '../services/barberService.js';
import { extractBearerFromHeader, extractOptionalBearerFromHeader } from '../utils/headerHandling.js';

const barberIdParamSchema = z.object({
    id: z.uuid('Invalid ID format'),
});

const getBarbersByShopSchema = z.object({
    id: z.uuid('Invalid shop ID format'),
});

const createBarberSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    email: z.string().trim().email('Invalid email format').max(255),
    phone: z.string().trim().max(10).optional().nullable(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
    gender: z.string().max(10),
    shopId: z.uuid('Invalid shop ID'),
    shiftId: z.uuid('Invalid shift ID'),
    bio: z.string().trim().max(2000).optional().nullable(),
    isAcceptingBookings: z.boolean().optional(),
});

const updateBarberSchema = z
    .object({
        firstName: z.string().max(100).optional(),
        lastName: z.string().max(100).optional(),
        email: z.string().max(255).optional(),
        phone: z.string().max(10).optional(),
        birthDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD')
            .optional(),
        gender: z.string().max(10).optional(),
        bio: z.string().max(2000).optional(),
        isAcceptingBookings: z.boolean().optional(),
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

export const getById: ApiHandler<BarberResponse | PublicBarberResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = barberIdParamSchema.parse({ id: req.params.id });

        const result = await getBarberDetails(validParams.id, token);
        sendSuccess({ res, data: result, message: 'Barber retrieved successfully' });
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

export const listByShop: ApiHandler<BarberResponse[] | PublicBarberResponse[]> = async (req, res) => {
    try {
        const token = extractOptionalBearerFromHeader(req);
        const validParams = getBarbersByShopSchema.parse({ id: req.params.id });
        const includeInactive = req.query.includeInactive === 'true';

        const result = await listBarbersByShop(validParams.id, token, includeInactive);
        sendSuccess({ res, data: result, message: 'Barbers retrieved successfully' });
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

export const create: ApiHandler<BarberResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validData = createBarberSchema.parse(req.body);

        const result = await registerBarber(validData, token);
        sendSuccess({ res, data: result, message: 'Barber created successfully', status: 201 });
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

export const update: ApiHandler<BarberResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validParams = barberIdParamSchema.parse({ id: req.params.id });
        const validData = updateBarberSchema.parse(req.body);

        const result = await updateBarber({ id: validParams.id, ...validData }, token);
        sendSuccess({ res, data: result, message: 'Barber updated successfully' });
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
        const validParams = barberIdParamSchema.parse({ id: req.params.id });

        await deleteBarber(validParams.id, token);
        sendSuccess({ res, message: 'Barber deleted successfully' });
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
