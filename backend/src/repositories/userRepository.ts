import db from '../connection/connection.js';
import type { User } from '../types/entities/user.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

// Interfaz definida para evitar el uso del tipo 'any' en los parámetros
export interface CreateUserInput {
    role: string;
    email: string;
    phone: string | null;
    password_hash: string;
    first_name: string;
    last_name: string;
}

/**
 * Busca un usuario activo por su dirección de correo electrónico.
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
    const pool = db.getPool();
    
    const query = `
        SELECT id, role, email, phone, password_hash, first_name, last_name, is_active, deleted_at, created_at, updated_at 
        FROM users 
        WHERE email = $1 
        AND deleted_at IS NULL 
        AND is_active = true
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Ejecuta una transacción SQL para asegurar una creación segura del usuario.
 * Primero verifica si el correo ya está registrado y, si no, crea el usuario.
 * Revierte (rollback) todos los cambios si ocurre algún error.
 */
export const createNewUserTransaction = async (userData: CreateUserInput): Promise<User> => {
    const pool = db.getPool();
    const client = await pool.connect(); // Obtiene un cliente específico para la transacción

    try {
        await client.query('BEGIN'); // Inicia la transacción

        // 1. Verifica si el usuario ya existe para evitar duplicados
        const checkQuery = `SELECT id FROM users WHERE email = $1`;
        const checkResult = await client.query(checkQuery, [userData.email]);
        
        if (checkResult.rows.length > 0) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 409, 'Email is already registered'); // Dispara el rollback
        }

        // 2. Crea el usuario devolviendo las columnas específicas
        const insertQuery = `
            INSERT INTO users (role, email, phone, password_hash, first_name, last_name)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, role, email, phone, password_hash, first_name, last_name, is_active, deleted_at, created_at, updated_at
        `;
        
        const values = [
            userData.role, 
            userData.email, 
            userData.phone, 
            userData.password_hash, 
            userData.first_name, 
            userData.last_name
        ];
        
        const result = await client.query(insertQuery, values);
        
        await client.query('COMMIT'); // Guarda los cambios en la base de datos
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK'); // Cancela la transacción si ocurre un error
        throw error;
    } finally {
        client.release(); // Siempre libera la conexión de vuelta al pool
    }
};