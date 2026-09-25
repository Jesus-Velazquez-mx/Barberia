import db from '../connection/connection.js';
import type { Receptionist } from '../types/entities/receptionist.interface.js';

/**
 * Busca el perfil de un recepcionista por su user_id. No filtra por deleted_at:
 * los llamadores que necesitan excluir recepcionistas dados de baja (p. ej.
 * login, que ya revisó staff_deleted_at) lo hacen antes de invocar esta función.
 */
export const getReceptionistByUserId = async (userId: string): Promise<Receptionist | null> => {
    const pool = db.getPool();

    const result = await pool.query(
        `SELECT user_id, shop_id, shift_id, deleted_at FROM receptionists WHERE user_id = $1`,
        [userId]
    );

    return result.rows.length ? result.rows[0] : null;
};
