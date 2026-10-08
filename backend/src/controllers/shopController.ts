import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { listActiveShops, getActiveShopById } from '../services/shopService.js';
import type { ShopResponse } from '../types/dto/shopResponse.interface.js';

// Validación del ID en los parámetros de la ruta
const getShopByIdSchema = z.object({
    id: z.uuid('Invalid shop ID format'),
});

export const list: ApiHandler<ShopResponse[]> = async (req, res) => {
    try {
        const result = await listActiveShops();
        sendSuccess({ res, data: result, message: 'Active shops retrieved successfully' });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};

export const getById: ApiHandler<ShopResponse> = async (req, res) => {
    try {
        const validParams = getShopByIdSchema.parse({ id: req.params.id });
        const result = await getActiveShopById(validParams.id);

        sendSuccess({ res, data: result, message: 'Shop retrieved successfully' });
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
