import { z, ZodError } from 'zod';
import { type ApiHandler } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import type { OfferedServicesResponse } from '../types/dto/offeredServiceResponse.interface.js';
import { listAllServices, getOfferedServiceById } from '../services/offeredServiceService.js';

const serviceIdParamsSchema = z.object({
    id: z.uuid('Invalid service ID format'),
});

export const listAll: ApiHandler<OfferedServicesResponse[]> = async (_req, res) => {
    try {
        const result = await listAllServices();
        sendSuccess({ res, data: result, message: 'Services retrieved successfully' });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};

export const getById: ApiHandler<OfferedServicesResponse> = async (req, res) => {
    try {
        const validParams = serviceIdParamsSchema.parse({ id: req.params.id });
        const result = await getOfferedServiceById(validParams.id);
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