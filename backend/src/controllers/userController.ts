import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { loginUser, registerUser} from '../services/userService.js';

const loginSchema = z.object({
    email: z.string().email(),
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
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Valida el cuerpo de la petición entrante usando Zod
        const validData = loginSchema.parse(req.body);

        // 2. Pasa los datos validados a la capa de servicios
        const result = await loginUser(validData);
        
        // 3. Devuelve una respuesta HTTP 200 OK
        res.status(200).json(result);
    } catch (error: any) {

        // Maneja los errores de validación generados por Zod
        if (error instanceof ZodError) {
            res.status(400).json({ issues: error.issues });
            return;
        }

        // Devuelve HTTP 404 Not Found para errores de autenticación
        if (error.message === 'NOT_FOUND' || error.message === 'INVALID_CREDENTIALS') {
            res.status(404).json({ message: 'User not found or invalid credentials' });
            return;
        }

        // Manejo general para errores inesperados del servidor
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Controlador para manejar las peticiones de registro.
 * Analiza el cuerpo de la petición y gestiona las respuestas HTTP.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Valida el cuerpo de la petición entrante usando Zod
        const validData = registerSchema.parse(req.body);

        // 2. Pasa los datos validados a la capa de servicios
        const result = await registerUser(validData);
        
        // 3. Devuelve una respuesta HTTP 201 Created
        res.status(201).json(result);
    } catch (error: any) {
        // Maneja los errores de validación generados por Zod
        if (error instanceof ZodError) {
            res.status(400).json({ issues: error.issues });
            return;
        }

        // Devuelve HTTP 409 Conflict si el correo electrónico ya está registrado en la base de datos
        if (error.message === 'USER_ALREADY_EXISTS') {
            res.status(409).json({ message: 'Email is already registered' });
            return;
        }

        // Manejo general para errores inesperados del servidor
        res.status(500).json({ message: 'Internal server error' });
    }
};