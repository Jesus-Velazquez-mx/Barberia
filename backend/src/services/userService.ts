import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createNewUserTransaction } from '../repositories/userRepository.js';
import { UserRole } from '../types/user.interface.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

// Interfaces para tipar fuertemente los datos de entrada en lugar de usar 'any'
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
 * Maneja la lógica de negocio para el inicio de sesión.
 * Valida las credenciales y devuelve un token JWT si son correctas.
 */
export const loginUser = async (data: LoginInput) => {
    const user = await getUserByEmail(data.email);
    
    // Lanza errores específicos para que el controlador devuelva los códigos HTTP adecuados
    if (!user) {
        throw new Error('NOT_FOUND');
    }

    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
        throw new Error('INVALID_CREDENTIALS');
    }

    // Genera un token válido por 8 horas
    const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    // Devuelve los datos del usuario sin el hash de la contraseña
    return {
        id: user.id,
        email: user.email,
        name: user.first_name,
        lastname: user.last_name,
        role: user.role,
        token: token
    };
};

/**
 * Maneja la lógica de negocio para el registro de usuarios.
 * Cifra la contraseña, crea el usuario y lo autentica automáticamente devolviendo un token.
 */
export const registerUser = async (data: RegisterInput) => {
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
        id: newUser.id,
        email: newUser.email,
        name: newUser.first_name,
        lastname: newUser.last_name,
        role: newUser.role,
        token: token
    };
};