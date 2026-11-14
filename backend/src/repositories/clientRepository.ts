import db from '../connection/connection.js';
import type { AppointmentClient } from '../types/dto/appointmentResponse.interface.js';
import type { Client, FacialStructureType } from '../types/entities/client.interface.js';
import type { UserRole } from '../types/entities/user.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

export interface CreateClientRepositoryInput {
    email: string;
    phone?: string | null;
    password_hash: string;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: string;
    facial_structure_type?: FacialStructureType | null;
    completed_services_count?: number;
}

export interface UpdateClientRepositoryInput {
    id: string;
    email?: string;
    phone?: string | null;
    password?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: Date;
    gender?: string;
    facialStructureType?: FacialStructureType | null;
    completedServicesCount?: number;
}

export interface ClientWithUser {
    id: string;
    role: UserRole;
    email: string;
    phone: string | null;
    password_hash: string;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: string;
    facial_structure_type: FacialStructureType | null;
    completed_services_count: number;
    created_at: Date;
    updated_at: Date;
}

const CLIENT_COLUMNS = `
    u.id, u.role, u.email, u.phone, u.password_hash, u.first_name, u.last_name,
    u.birth_date, u.gender, u.created_at, u.updated_at,
    c.facial_structure_type, c.completed_services_count
`;

/**
 * Busca el perfil de un cliente por su user_id.
 */
export const getClientByUserId = async (userId: string): Promise<Client | null> => {
    const pool = db.getPool();

    const result = await pool.query(
        `SELECT user_id, facial_structure_type, completed_services_count FROM clients WHERE user_id = $1`,
        [userId]
    );

    return result.rows.length ? result.rows[0] : null;
};

export const updateClientFacialStructure = async (userId: string, facialStructure: string): Promise<void> => {
    const pool = db.getPool();

    await pool.query(`UPDATE clients SET facial_structure_type = $1 WHERE user_id = $2`, [facialStructure, userId]);
};

/**
 * Descarta la estructura facial guardada para que se vuelva a detectar a partir de la foto vigente.
 */
export const clearClientFacialStructure = async (userId: string): Promise<void> => {
    const pool = db.getPool();

    await pool.query(`UPDATE clients SET facial_structure_type = NULL WHERE user_id = $1`, [userId]);
};

export const getAppointmentClientsById = async (clientIds: string[]): Promise<AppointmentClient[]> => {
    if (clientIds.length === 0) return [];

    const result = await db.getPool().query(
        `SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
            c.completed_services_count AS "completedServicesCount"
        FROM users u
        JOIN clients c ON c.user_id = u.id
        WHERE u.role = 'client' AND u.id = ANY($1::uuid[])`,
        [clientIds]
    );

    return result.rows;
};

/**
 * Obtiene un cliente por su ID combinando los datos de users y clients.
 */
export const getClientById = async (id: string): Promise<ClientWithUser | null> => {
    const pool = db.getPool();
    const query = `
        SELECT ${CLIENT_COLUMNS}
        FROM users u
        JOIN clients c ON c.user_id = u.id
        WHERE u.id = $1 AND u.role = 'client'
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca clientes por coincidencia parcial en nombre, apellido, nombre completo o correo.
 */
export const searchClients = async (term: string): Promise<ClientWithUser[]> => {
    const pool = db.getPool();
    const escaped = term.replace(/[\\%_]/g, '\\$&');
    const query = `
        SELECT ${CLIENT_COLUMNS}
        FROM users u
        JOIN clients c ON c.user_id = u.id
        WHERE u.role = 'client'
          AND (
              u.first_name ILIKE $1
              OR u.last_name ILIKE $1
              OR u.email ILIKE $1
              OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $1
          )
        ORDER BY u.first_name, u.last_name
        LIMIT 20
    `;
    const result = await pool.query(query, [`%${escaped}%`]);
    return result.rows;
};

/**
 * Obtiene la lista completa de todos los clientes registrados.
 */
export const getAllClients = async (): Promise<ClientWithUser[]> => {
    const pool = db.getPool();
    const query = `
        SELECT ${CLIENT_COLUMNS}
        FROM users u
        JOIN clients c ON c.user_id = u.id
        WHERE u.role = 'client'
        ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Ejecuta una transacción SQL para crear un cliente manipulando users y clients.
 * Valida unicidad de email y teléfono antes de insertar.
 */
export const createClient = async (data: CreateClientRepositoryInput): Promise<ClientWithUser> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Valida unicidad de correo
        const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [data.email]);
        if (emailCheck.rows.length > 0) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email is already registered');
        }

        // 2. Valida unicidad de teléfono si se proporciona
        if (data.phone) {
            const phoneCheck = await client.query('SELECT id FROM users WHERE phone = $1', [data.phone]);
            if (phoneCheck.rows.length > 0) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Phone is already registered');
            }
        }

        // 3. Inserta en la tabla 'users' con role = 'client'
        const insertUserQuery = `
            INSERT INTO users (role, email, phone, password_hash, first_name, last_name, birth_date, gender)
            VALUES ('client', $1, $2, $3, $4, $5, $6, $7)
            RETURNING id, role, email, phone, password_hash, first_name, last_name, birth_date, gender, created_at, updated_at
        `;
        const userResult = await client.query(insertUserQuery, [
            data.email,
            data.phone ?? null,
            data.password_hash,
            data.first_name,
            data.last_name,
            data.birth_date,
            data.gender,
        ]);
        const newUser = userResult.rows[0];

        // 4. Inserta en la tabla 'clients' asociada
        const insertClientQuery = `
            INSERT INTO clients (user_id, facial_structure_type, completed_services_count)
            VALUES ($1, $2, $3)
            RETURNING user_id, facial_structure_type, completed_services_count
        `;
        const clientResult = await client.query(insertClientQuery, [
            newUser.id,
            data.facial_structure_type ?? null,
            data.completed_services_count ?? 0,
        ]);
        const newClient = clientResult.rows[0];

        await client.query('COMMIT');

        return {
            ...newUser,
            facial_structure_type: newClient.facial_structure_type,
            completed_services_count: newClient.completed_services_count,
        };
    } catch (error: unknown) {
        await client.query('ROLLBACK');
        const dbError = error as { code?: string; constraint?: string };
        if (dbError.code === '23505') {
            if (dbError.constraint?.includes('email')) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email is already registered');
            }
            if (dbError.constraint?.includes('phone')) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Phone is already registered');
            }
            throw new ApiError(ApiErrorCode.CONFLICT, 'Unique constraint violation');
        }
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Ejecuta una transacción SQL para actualizar un cliente en users y/o clients.
 * Bloquea el registro con FOR UPDATE y valida unicidad de email/teléfono si cambiaron.
 */
export const updateClientById = async (fields: UpdateClientRepositoryInput): Promise<ClientWithUser> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Bloquea y verifica que el registro exista y sea cliente
        const currentResult = await client.query('SELECT id, role FROM users WHERE id = $1 FOR UPDATE', [fields.id]);
        if (currentResult.rows.length === 0 || currentResult.rows[0].role !== 'client') {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client not found');
        }

        // 2. Verifica unicidad de correo y teléfono si se están modificando
        if (fields.email !== undefined) {
            const emailCheck = await client.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [
                fields.email,
                fields.id,
            ]);
            if (emailCheck.rows.length > 0) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email is already registered');
            }
        }

        if (fields.phone !== undefined && fields.phone !== null) {
            const phoneCheck = await client.query('SELECT id FROM users WHERE phone = $1 AND id <> $2', [
                fields.phone,
                fields.id,
            ]);
            if (phoneCheck.rows.length > 0) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Phone is already registered');
            }
        }

        // 3. Actualización dinámica en tabla 'users'
        const userSetClauses: string[] = [];
        const userValues: unknown[] = [];
        const userColumns: [keyof UpdateClientRepositoryInput, string][] = [
            ['email', 'email'],
            ['phone', 'phone'],
            ['password', 'password_hash'],
            ['firstName', 'first_name'],
            ['lastName', 'last_name'],
            ['birthDate', 'birth_date'],
            ['gender', 'gender'],
        ];

        for (const [field, column] of userColumns) {
            const value = fields[field];
            if (value !== undefined) {
                userValues.push(value);
                userSetClauses.push(`${column} = $${userValues.length}`);
            }
        }

        if (userSetClauses.length > 0) {
            userValues.push(fields.id);
            await client.query(
                `UPDATE users SET ${userSetClauses.join(', ')} WHERE id = $${userValues.length}`,
                userValues
            );
        }

        // 4. Actualización dinámica en tabla 'clients'
        const clientSetClauses: string[] = [];
        const clientValues: unknown[] = [];
        if (fields.facialStructureType !== undefined) {
            clientValues.push(fields.facialStructureType);
            clientSetClauses.push(`facial_structure_type = $${clientValues.length}`);
        }
        if (fields.completedServicesCount !== undefined) {
            clientValues.push(fields.completedServicesCount);
            clientSetClauses.push(`completed_services_count = $${clientValues.length}`);
        }

        if (clientSetClauses.length > 0) {
            clientValues.push(fields.id);
            await client.query(
                `UPDATE clients SET ${clientSetClauses.join(', ')} WHERE user_id = $${clientValues.length}`,
                clientValues
            );
        }

        // 5. Consulta los datos actualizados
        const updatedResult = await client.query(
            `SELECT ${CLIENT_COLUMNS}
             FROM users u
             JOIN clients c ON c.user_id = u.id
             WHERE u.id = $1`,
            [fields.id]
        );

        await client.query('COMMIT');
        return updatedResult.rows[0];
    } catch (error: unknown) {
        await client.query('ROLLBACK');
        const dbError = error as { code?: string; constraint?: string };
        if (dbError.code === '23505') {
            if (dbError.constraint?.includes('email')) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email is already registered');
            }
            if (dbError.constraint?.includes('phone')) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Phone is already registered');
            }
            throw new ApiError(ApiErrorCode.CONFLICT, 'Unique constraint violation');
        }
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Ejecuta una transacción SQL para eliminar físicamente un cliente de clients y users.
 */
export const deleteClientById = async (id: string): Promise<void> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verifica si existe y es cliente
        const userCheck = await client.query('SELECT id, role FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'client') {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client not found');
        }

        // 2. Borra primero de la tabla 'clients'
        await client.query('DELETE FROM clients WHERE user_id = $1', [id]);

        // 3. Borra de la tabla 'users'
        const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client not found');
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
