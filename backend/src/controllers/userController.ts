import { z, ZodError } from 'zod';
import { loginUser, registerUser } from '../services/userService.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendFail } from '../utils/apiResponse.js';
import type { AuthResponse } from '../types/dto/authResponse.interface.js';

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1)
});

const registerSchema = z.object({
    name: z.string().min(2),
    lastname: z.string().min(2),
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
        sendSuccess(res, result, 'Inicio de sesión exitoso', 200);
    } catch (error: any) {
        // Maneja los errores de validación generados por Zod
        if (error instanceof ZodError) {
            sendFail(res, 'Error de validación', error.issues.map((issue) => issue.message), 400);
            return;
        }

        // Devuelve HTTP 404 Not Found para errores de autenticación para no revelar detalles exactos
        if (error.message === 'NOT_FOUND' || error.message === 'INVALID_CREDENTIALS') {
            sendFail(res, 'User not found or invalid credentials', null, 404);
            return;
        }

        // Manejo general para errores inesperados del servidor
        sendFail(res, 'Internal server error', [String(error)], 500);
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
        sendSuccess(res, result, 'Usuario registrado correctamente', 201);
    } catch (error: any) {
        // Maneja los errores de validación generados por Zod
        if (error instanceof ZodError) {
            sendFail(res, 'Error de validación', error.issues.map((issue) => issue.message), 400);
            return;
        }

        // Devuelve HTTP 409 Conflict si el correo electrónico ya está registrado en la base de datos
        if (error.message === 'USER_ALREADY_EXISTS') {
            sendFail(res, 'Email is already registered', null, 409);
            return;
        }

        // Manejo general para errores inesperados del servidor
        sendFail(res, 'Internal server error', [String(error)], 500);
    }
};
