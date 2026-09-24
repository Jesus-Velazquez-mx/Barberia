import { z, ZodError } from 'zod';
import { UserResponse } from "../types/dto/userResponse.interface.js"
import { ApiHandler, sendFail, sendValidationError } from "../utils/apiResponse.js"
import { log } from 'node:console';

// Token indicates the user performing the operation,
// while the user object is the operation target
const updateUserSchema = z.object({
    user: z.object({
        id: z.uuid(),
        email: z.email().optional(),
        phone: z.string().length(10).optional(),
        password: z.string().min(6).optional(),
        name: z.string().min(2).optional(),
        lastname: z.string().min(2).optional(),
    }),
    token: z.jwt()
})

export const update: ApiHandler<UserResponse> = async (req, res) => {
    try {
        const validData = updateUserSchema.parse(req.body);

        res.status(200).send()
    } catch (error:unknown) {
        if (error instanceof ZodError) {
            sendValidationError(res, error);
        }
    }
}