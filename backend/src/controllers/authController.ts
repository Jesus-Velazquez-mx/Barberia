import { z, ZodError } from 'zod';
import { LoginInput, loginUser, RegisterInput, registerUser } from '../services/authService.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendFail, sendValidationError, sendInternalServerError } from '../utils/apiResponse.js';
import type { AuthResponse } from '../types/dto/authResponse.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

const loginSchema: z.ZodType<LoginInput> = z.object({
    email: z.email(),
    password: z.string().min(1)
});

const registerSchema: z.ZodType<RegisterInput> = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z.string().max(10).optional(),
    email: z.email(),
    password: z.string().min(6)
});

/**
 * Controlador para manejar las peticiones de inicio de sesión.
 * Analiza el cuerpo de la petición y gestiona las respuestas HTTP.
 */
export const login: ApiHandler<AuthResponse> = async (req, res) => {
    try {
        // 1. Valida el cuerpo de la petición entrante usando Zod
        const validData = loginSchema.parse(req.body);

        // 2. Pasa los datos validados a la capa de servicios
        const result = await loginUser(validData);

        // 3. Devuelve una respuesta HTTP 200 OK
        sendSuccess({ res, data: result, message: 'Login successful' });
    } catch (error: unknown) {
        // Maneja los errores de validación generados por Zod
        if (error instanceof ZodError) {
            sendValidationError({ res, error })
            return;
        }

        // Devuelve HTTP 404 Not Found para errores de autenticación para no revelar detalles exactos
        if (error instanceof ApiError) {
            sendFail({ res, message: 'User not found or invalid credentials', status: error.code });
            return;
        }

        // Manejo general para errores inesperados del servidor
        sendInternalServerError({ res, error: [String(error)] });
    }
};

/**
 * Controlador para manejar las peticiones de registro.
 * Analiza el cuerpo de la petición y gestiona las respuestas HTTP.
 */
export const register: ApiHandler<AuthResponse> = async (req, res) => {
    try {
        // 1. Valida el cuerpo de la petición entrante usando Zod
        const validData = registerSchema.parse(req.body);

        // 2. Pasa los datos validados a la capa de servicios
        const result = await registerUser(validData);

        // 3. Devuelve una respuesta HTTP 201 Created
        sendSuccess({ res, data: result, message: 'User registered successfully', status: 201 });
    } catch (error: unknown) {
        // Maneja los errores de validación generados por Zod
        if (error instanceof ZodError) {
            sendValidationError({ res, error })
            return;
        }

        // Devuelve HTTP 409 Conflict si el correo electrónico ya está registrado en la base de datos
        if (error instanceof ApiError && error.code === ApiErrorCode.USER_ALREADY_EXISTS) {
            sendFail({ res, message: 'Email is already registered', status: error.code });
            return;
        }

        // Manejo general para errores inesperados del servidor
        sendInternalServerError({ res, error: [String(error)] });
    }
};
