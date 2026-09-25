import { z, ZodError } from 'zod';
import type { ManagerResponse } from '../types/dto/managerResponse.interface.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { updateManager } from '../services/managerService.js';

// Token indicates the user performing the operation,
// while the manager object is the operation target
const updateManagerSchema = z.object({
    manager: z.object({
        id: z.uuid(),
        title: z.string().min(1).max(100),
    }),
    token: z.jwt()
});

export const update: ApiHandler<ManagerResponse> = async (req, res) => {
    try {
        const validData = updateManagerSchema.parse(req.body);

        const result = await updateManager(validData.manager, validData.token);

        sendSuccess(res, result, 'Manager updated successfully');
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
