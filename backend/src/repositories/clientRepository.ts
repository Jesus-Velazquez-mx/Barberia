import db from '../connection/connection.js';
import type { AppointmentClient } from '../types/dto/appointmentResponse.interface.js';
import type { Client } from '../types/entities/client.interface.js';

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
