import bcrypt from 'bcrypt';
import { getUserByEmail, createNewUser, isUserActive } from '../repositories/userRepository.js';
import type { UserRole } from '../types/entities/user.interface.js';
import type { AuthResponse } from '../types/dto/authResponse.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { signToken } from './jwtTokenService.js';
import { toUserResponse, toClientProfile } from '../utils/userMapper.js';
import { getUserProfile } from './userService.js';



// Interfaces para tipar los datos de entrada en lugar de usar 'any'
export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
    password: string;
}

/**
 * Maneja la lógica de negocio para el inicio de sesión.
 * Valida las credenciales y devuelve un token JWT si son correctas.
 */
export const loginUser = async (data: LoginInput): Promise<AuthResponse> => {
    const user = await getUserByEmail(data.email);

    // Lanza errores específicos para que el controlador devuelva los códigos HTTP adecuados
    if (!user) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'User not found');
    }

    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
        throw new ApiError(ApiErrorCode.INVALID_CREDENTIALS, 'Invalid credentials');
    }

    // Checked after the password, not before, so a wrong-password attempt against a
    // deactivated staff account still reads as invalid credentials, not a status leak.
    if (!(await isUserActive(user.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    // Obtiene los datos específicos del rol para anidar dentro de `user`
    const profile = await getUserProfile(user);

    // Devuelve los datos del usuario sin el hash de la contraseña
    return {
        user: { ...toUserResponse(user), profile },
        token: signToken(user)
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
    const { user: newUser, client: newClient } = await createNewUser({
        email: data.email,
        password_hash: hashedPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
        role: 'client' as UserRole
    });

    // Devuelve los datos del usuario recién creado sin el hash de la contraseña
    return {
        user: { ...toUserResponse(newUser), profile: toClientProfile(newClient) },
        token: signToken(newUser)
    };
};