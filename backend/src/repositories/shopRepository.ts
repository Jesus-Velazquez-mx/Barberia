import db from '../connection/connection.js';
import type { Shop } from '../types/entities/shop.interface.js';

/**
 * Recupera todas las sucursales que están actualmente activas, ordenadas alfabéticamente.
 */
export const getActiveShops = async (): Promise<Shop[]> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, street, postal_code, number, phone, manager_id, is_active, created_at, updated_at
        FROM shops 
        WHERE is_active = true 
        ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Busca una sucursal por su ID. No filtra por is_active.
 */
export const getShopById = async (id: string): Promise<Shop | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, street, postal_code, number, phone, manager_id, is_active, created_at, updated_at
        FROM shops 
        WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
};