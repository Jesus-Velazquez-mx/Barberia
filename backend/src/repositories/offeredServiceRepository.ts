import db from '../connection/connection.js';
import type { OfferedService } from '../types/entities/offeredService.interface.js';

/**
 * Busca un servicio por su ID. No filtra por is_active.
 */
export const getServiceById = async (id: string): Promise<OfferedService | null> => {
    const result = await db.getPool().query(
        `SELECT id, category_id, name, description, duration_minutes, price, is_active, created_at, updated_at
         FROM services WHERE id = $1`,
        [id]
    );
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Obtiene todos los servicios activos del catálogo ordenados por nombre.
 */
export const getActiveServices = async (): Promise<OfferedService[]> => {
    const result = await db.getPool().query(
        `SELECT id, category_id, name, description, duration_minutes, price, is_active, created_at, updated_at
         FROM services
         WHERE is_active = true
         ORDER BY name ASC`
    );
    return result.rows;
};
