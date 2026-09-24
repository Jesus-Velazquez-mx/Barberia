import { z, ZodError } from 'zod';
import type { BarberResponse } from '../types/dto/barberResponse.interface.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { updateBarber } from '../services/barberService.js';

// Token indicates the user performing the operation,
// while the barber object is the operation target
const updateBarberSchema = z.object({
    barber: z.object({
        id: z.uuid(),
        bio: z.string().max(2000).optional(),
        isAcceptingBookings: z.boolean().optional(),
    }).refine((data) => data.bio !== undefined || data.isAcceptingBookings !== undefined, {
        message: 'At least one of bio or isAcceptingBookings must be provided'
    }),
    token: z.jwt()
});

export const update: ApiHandler<BarberResponse> = async (req, res) => {
    try {
        const validData = updateBarberSchema.parse(req.body);

        const result = await updateBarber(validData.barber, validData.token);

        sendSuccess(res, result, 'Barber updated successfully');
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            sendValidationError(res, error);
            return;
        }

        if (error instanceof ApiError) {
            sendFail(res, error.message, error.code);
            return;
        }

        sendInternalServerError(res, [String(error)]);
    }
}
