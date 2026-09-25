import db from '../connection/connection.js';
import type { User, UserRole } from '../types/entities/user.interface.js';
import type { Client } from '../types/entities/client.interface.js';
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

export interface UpdateUserInput {
    id: string;
    email?: string;
    phone?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
}

/**
 * Busca un usuario por su dirección de correo electrónico.
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
    const pool = db.getPool();

    // staff_deleted_at: only one of the three joins can ever match (role is
    // exclusive), so COALESCE collapses whichever role table applies into one
    // column; NULL for clients, who are hard-deleted instead of soft-deleted.
    const query = `
        SELECT u.id, u.role, u.email, u.phone, u.password_hash, u.first_name, u.last_name,
               u.created_at, u.updated_at,
               COALESCE(b.deleted_at, m.deleted_at, r.deleted_at) AS staff_deleted_at
        FROM users u
        LEFT JOIN barbers b ON b.user_id = u.id
        LEFT JOIN managers m ON m.user_id = u.id
        LEFT JOIN receptionists r ON r.user_id = u.id
        WHERE u.email = $1
    `;

    const result = await pool.query(query, [email]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca únicamente el id y el rol de un usuario. Usado para la comprobación de
 * autorización de updateUserById, que no necesita el resto de las columnas.
 */
export const getUserRoleById = async (id: string): Promise<{ id: string; role: UserRole } | null> => {
    const pool = db.getPool();

    const result = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Ejecuta una transacción SQL para asegurar una creación segura del usuario.
 * Primero verifica si el correo ya está registrado y, si no, crea el usuario
 * junto con su fila en `clients` (todo registro nuevo es un cliente). Revierte
 * (rollback) todos los cambios si ocurre algún error.
 */
export const createNewUser = async (userData: CreateUserInput): Promise<{ user: User; client: Client }> => {
    const pool = db.getPool();
    const client = await pool.connect(); // Obtiene un cliente específico para la transacción

    try {
        await client.query('BEGIN'); // Inicia la transacción

        // 1. Verifica si el usuario ya existe para evitar duplicados
        const checkQuery = `SELECT id FROM users WHERE email = $1`;
        const checkResult = await client.query(checkQuery, [userData.email]);
        
        if (checkResult.rows.length > 0) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email is already registered'); // Dispara el rollback
        }

        // 2. Crea el usuario devolviendo las columnas específicas
        const insertQuery = `
            INSERT INTO users (role, email, phone, password_hash, first_name, last_name)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, role, email, phone, password_hash, first_name, last_name, created_at, updated_at
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
        const newUser: User = result.rows[0];

        // 3. Crea la fila de cliente asociada (todo registro nuevo es un cliente)
        const clientResult = await client.query(
            `INSERT INTO clients (user_id) VALUES ($1)
             RETURNING user_id, facial_structure_type, completed_services_count`,
            [newUser.id]
        );

        await client.query('COMMIT'); // Guarda los cambios en la base de datos
        return { user: newUser, client: clientResult.rows[0] };
    } catch (error) {
        await client.query('ROLLBACK'); // Cancela la transacción si ocurre un error
        throw error;
    } finally {
        client.release(); // Siempre libera la conexión de vuelta al pool
    }
};

/**
 * Ejecuta una transacción SQL para actualizar los datos compartidos (tabla users)
 * de un usuario. Solo modifica las columnas presentes en `fields`, valida que el
 * correo/teléfono no pertenezcan ya a otro usuario, y revierte todo si algo falla.
 */
export const updateUserById = async (fields: UpdateUserInput): Promise<User> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Bloquea y confirma que el usuario objetivo existe
        const currentResult = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [fields.id]);
        if (currentResult.rows.length === 0) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'User not found');
        }

        // 2. Verifica que el correo/teléfono, si se están cambiando, no estén en uso por otro usuario
        if (fields.email !== undefined) {
            const emailCheck = await client.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [fields.email, fields.id]);
            if (emailCheck.rows.length > 0) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email is already registered');
            }
        }
        if (fields.phone !== undefined) {
            const phoneCheck = await client.query('SELECT id FROM users WHERE phone = $1 AND id <> $2', [fields.phone, fields.id]);
            if (phoneCheck.rows.length > 0) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Phone is already registered');
            }
        }

        // 3. Construye el SET dinámicamente con solo los campos presentes
        const setClauses: string[] = [];
        const values: unknown[] = [];

        // fields.password llega ya cifrado por la capa de servicio (mismo patrón que CreateUserInput.password_hash)
        const columnByField: [keyof UpdateUserInput, string][] = [
            ['email', 'email'],
            ['phone', 'phone'],
            ['password', 'password_hash'],
            ['firstName', 'first_name'],
            ['lastName', 'last_name'],
        ];

        for (const [field, column] of columnByField) {
            const value = fields[field];
            if (value !== undefined) {
                values.push(value);
                setClauses.push(`${column} = $${values.length}`);
            }
        }

        if (setClauses.length === 0) {
            await client.query('ROLLBACK');
            return currentResult.rows[0];
        }

        values.push(fields.id);
        const updateQuery = `
            UPDATE users SET ${setClauses.join(', ')}
            WHERE id = $${values.length}
            RETURNING id, role, email, phone, password_hash, first_name, last_name, created_at, updated_at
        `;

        const result = await client.query(updateQuery, values);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
