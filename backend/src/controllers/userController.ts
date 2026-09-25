import { z, ZodError } from 'zod';
import { UserResponse } from "../types/dto/userResponse.interface.js"
import { ApiHandler, sendFail, sendInternalServerError, sendSuccess, sendValidationError } from "../utils/apiResponse.js"
import { ApiError } from '../errors/ApiError.js';
import { updateUser } from '../services/userService.js';
import { UpdateUserInput } from '../repositories/userRepository.js';

// Token indicates the user performing the operation,
// while the user object is the operation target
const updateUserSchema = z.object({
    user: z.object({
        id: z.uuid(),
        email: z.email().optional(),
        phone: z.string().length(10).optional(),
        password: z.string().min(6).optional(),
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
    }) satisfies z.ZodType<UpdateUserInput>,
    token: z.jwt()
})

export const update: ApiHandler<UserResponse> = async (req, res) => {
    try {
        const validData = updateUserSchema.parse(req.body);

        const result = await updateUser(validData.user, validData.token);

        sendSuccess(res, result, 'User updated successfully');
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