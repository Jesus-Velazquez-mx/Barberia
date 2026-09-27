import { z, ZodError } from 'zod';
import { UserResponse } from "../types/dto/userResponse.interface.js"
import { ApiHandler, sendFail, sendInternalServerError, sendSuccess, sendValidationError } from "../utils/apiResponse.js"
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { updateUser, deleteUserById } from '../services/userService.js';
import { UpdateUserInput } from '../repositories/userRepository.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';

// El token indica el usuario que realiza la operación,
// mientras que el objeto user es el objetivo de la operación
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

// El token indica el usuario que autoriza y realiza la acción,
// mientras que el id especifica la cuenta objetivo que será eliminada
const deleteUserSchema = z.object({
    id: z.uuid(),
    token: z.jwt()
});

export const update: ApiHandler<UserResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);

        const validData = updateUserSchema.parse({ ...req.body, token });

        const result = await updateUser(validData.user, validData.token);

        // sendSuccess(res, 'User updated successfully', result);
        sendSuccess({ res, message: 'User updated successfully', data: result });
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
}

export const deleteUser: ApiHandler<void> = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        const id = req.params.id;

        // Extrae el token JWT del header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(ApiErrorCode.UNAUTHORIZED, 'Missing or invalid authorization token');
        }
        const token = authHeader.split(' ')[1];

        // Valida los datos de entrada
        const validData = deleteUserSchema.parse({ id, token });

        // Ejecuta el servicio de borrado
        await deleteUserById(validData.id, validData.token);

        // Responde con éxito
        sendSuccess({ res, message: 'User deleted successfully' });
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
}
