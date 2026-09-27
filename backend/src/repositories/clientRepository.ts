import db from '../connection/connection.js';
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
