import { Router } from 'express';
import { login, register } from '../controllers/authController.js';

const router = Router();

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Inicia sesión de un usuario
 *     description: Valida las credenciales y, de ser correctas, retorna los datos del usuario junto con un token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: cliente@mrbarber.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Éxito. `data` contiene el usuario autenticado y el token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         role: { type: string, enum: [client, barber, manager, receptionist] }
 *                         email: { type: string, format: email }
 *                         phone: { type: string, nullable: true }
 *                         firstName: { type: string }
 *                         lastName: { type: string }
 *                         createdAt: { type: string, format: date-time }
 *                         updatedAt: { type: string, format: date-time }
 *                     token: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *                 message: { type: string, example: Inicio de sesión exitoso }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       400:
 *         description: Error de validación de los datos enviados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Error de validación }
 *                 error: { type: array, items: { type: string }, example: ["Invalid email"] }
 *       404:
 *         description: Usuario no encontrado o credenciales inválidas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: User not found or invalid credentials }
 *                 error: { nullable: true, example: null }
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Internal server error }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.post('/auth/login', login);

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     description: Crea un cliente nuevo, cifra su contraseña y retorna sus datos junto con un token JWT para iniciar sesión automáticamente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastname, email, password]
 *             properties:
 *               name: { type: string, example: Juan }
 *               lastname: { type: string, example: Pérez }
 *               phone: { type: string, example: "3312345678" }
 *               email: { type: string, format: email, example: cliente@mrbarber.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       201:
 *         description: Éxito. `data` contiene el usuario creado y el token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         role: { type: string, enum: [client, barber, manager, receptionist] }
 *                         email: { type: string, format: email }
 *                         phone: { type: string, nullable: true }
 *                         firstName: { type: string }
 *                         lastName: { type: string }
 *                         createdAt: { type: string, format: date-time }
 *                         updatedAt: { type: string, format: date-time }
 *                     token: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *                 message: { type: string, example: Usuario registrado correctamente }
 *                 error: { type: array, items: { type: string }, nullable: true, example: null }
 *       400:
 *         description: Error de validación de los datos enviados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Error de validación }
 *                 error: { type: array, items: { type: string }, example: ["Invalid email"] }
 *       409:
 *         description: El correo electrónico ya está registrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Email is already registered }
 *                 error: { nullable: true, example: null }
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { nullable: true, example: null }
 *                 message: { type: string, example: Internal server error }
 *                 error: { type: array, items: { type: string }, example: ["detalle del error"] }
 */
router.post('/auth/register', register);

export default router;
