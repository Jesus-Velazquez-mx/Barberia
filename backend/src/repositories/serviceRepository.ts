import db from '../connection/connection.js';
import type { Service } from '../types/entities/service.interface.js';

/**
 * Busca un servicio por su ID. No filtra por is_active.
 */
export const getServiceById = async (id: string): Promise<Service | null> => {
    const result = await db.getPool().query(
        `SELECT id, category_id, name, description, duration_minutes, price, is_active, created_at, updated_at
         FROM services WHERE id = $1`,
        [id]
    );
    return result.rows.length ? result.rows[0] : null;
};
