import db from '../connection/connection.js';
import type { Manager } from '../types/entities/manager.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

export interface UpdateManagerInput {
    userId: string;
    title: string;
}

/**
 * Busca el perfil de un manager por su user_id. No filtra por deleted_at: los
 * llamadores que necesitan excluir managers dados de baja (p. ej. login, que ya
 * revisó isUserActive) lo hacen antes de invocar esta función.
 */
export const getManagerByUserId = async (userId: string): Promise<Manager | null> => {
    const pool = db.getPool();

    const result = await pool.query(
        `SELECT user_id, title, deleted_at FROM managers WHERE user_id = $1`,
        [userId]
    );

    return result.rows.length ? result.rows[0] : null;
};

/**
 * Actualiza el título de un manager. AND deleted_at IS NULL evita que un token
 * vigente pueda editar un manager que ya fue dado de baja.
 */
export const updateManagerTitleById = async (fields: UpdateManagerInput): Promise<Manager> => {
    const pool = db.getPool();

    const result = await pool.query(
        `UPDATE managers SET title = $1 WHERE user_id = $2 AND deleted_at IS NULL
         RETURNING user_id, title, deleted_at`,
        [fields.title, fields.userId]
    );

    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Manager not found');
    }

    return result.rows[0];
};
