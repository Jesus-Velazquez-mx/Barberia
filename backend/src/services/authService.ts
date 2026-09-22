import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createNewUserTransaction } from '../repositories/userRepository.js';
import type { User, UserRole } from '../types/entities/user.interface.js';
import type { UserResponse } from '../types/dto/userResponse.interface.js';
import type { AuthResponse } from '../types/dto/authResponse.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

// Interfaces para tipar los datos de entrada en lugar de usar 'any'
export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    name: string;
    lastname: string;
    phone?: string;
    email: string;
    password: string;
}

/**
 * Elimina el hash de la contraseña antes de exponer el usuario en una respuesta.
 */
const toUserResponse = (user: User): UserResponse => {
    const { password_hash: _password_hash, staff_deleted_at: _staff_deleted_at, ...userResponse } = user;
    return userResponse;
};

/**
 * Maneja la lógica de negocio para el inicio de sesión.
 * Valida las credenciales y devuelve un token JWT si son correctas.
 */
export const loginUser = async (data: LoginInput): Promise<AuthResponse> => {
    const user = await getUserByEmail(data.email);

    // Lanza errores específicos para que el controlador devuelva los códigos HTTP adecuados
    if (!user) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 404, 'User not found');
    }

    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
        throw new ApiError(ApiErrorCode.INVALID_CREDENTIALS, 404, 'Invalid credentials');
    }

    // Checked after the password, not before, so a wrong-password attempt against a
    // deactivated staff account still reads as invalid credentials, not a status leak.
    if (user.staff_deleted_at) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 403, 'Account is deactivated');
    }

    // Genera un token válido por 8 horas
    const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    // Devuelve los datos del usuario sin el hash de la contraseña
    return {
        user: toUserResponse(user),
        token: token
    };
};

/**
 * Maneja la lógica de negocio para el registro de usuarios.
 * Cifra la contraseña, crea el usuario y lo autentica automáticamente devolviendo un token.
 */
export const registerUser = async (data: RegisterInput): Promise<AuthResponse> => {
    // Cifra la contraseña con un factor de costo (salt rounds) de 10
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Llama a la transacción del repositorio para verificar existencia e insertar de forma segura
    const newUser = await createNewUserTransaction({
        email: data.email,
        password_hash: hashedPassword,
        first_name: data.name,
        last_name: data.lastname,
        phone: data.phone || null,
        role: 'client' as UserRole
    });

    // Genera el token para que el usuario inicie sesión inmediatamente después de registrarse
    const token = jwt.sign(
        { id: newUser.id, role: newUser.role, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    // Devuelve los datos del usuario recién creado sin el hash de la contraseña
    return {
        user: toUserResponse(newUser),
        token: token
    };
};