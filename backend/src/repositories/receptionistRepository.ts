import db from '../connection/connection.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import type { Receptionist, ReceptionistWithUser } from '../types/entities/receptionist.interface.js';

// password_hash se deja fuera a propósito: nunca debe salir de la capa de repositorio hacia las respuestas.
const RECEPTIONIST_WITH_USER_COLUMNS = `
    r.user_id, r.shop_id, r.shift_id, r.deleted_at,
    u.email, u.phone, u.first_name, u.last_name, u.birth_date, u.gender, u.created_at, u.updated_at
`;

export interface CreateReceptionistInput {
    email: string;
    phone: string | null;
    passwordHash: string;
    firstName: string;
    lastName: string;
    birthDate: Date;
    gender: string;
    shopId: string;
    shiftId: string;
}

/**
 * Busca el perfil de un recepcionista por su user_id. No filtra por deleted_at:
 * los llamadores que necesitan excluir recepcionistas dados de baja (p. ej.
 * login, que ya revisó isUserActive) lo hacen antes de invocar esta función.
 */
export const getReceptionistByUserId = async (userId: string): Promise<Receptionist | null> => {
    const pool = db.getPool();

    const result = await pool.query(
        `SELECT user_id, shop_id, shift_id, deleted_at FROM receptionists WHERE user_id = $1`,
        [userId]
    );

    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca un recepcionista junto con sus datos personales (tabla users). No filtra por deleted_at,
 * para que el servicio pueda distinguir "no existe" de "está dado de baja".
 */
export const getReceptionistWithUserById = async (userId: string): Promise<ReceptionistWithUser | null> => {
    const pool = db.getPool();

    const result = await pool.query(
        `SELECT ${RECEPTIONIST_WITH_USER_COLUMNS}
         FROM receptionists r
         JOIN users u ON u.id = r.user_id
         WHERE r.user_id = $1`,
        [userId]
    );

    return result.rows.length ? result.rows[0] : null;
};

/**
 * Recepcionistas de una sucursal ordenados por nombre. Por defecto excluye a los dados de baja.
 */
export const getReceptionistsByShop = async (
    shopId: string,
    includeDeleted = false
): Promise<ReceptionistWithUser[]> => {
    const pool = db.getPool();

    const result = await pool.query(
        `SELECT ${RECEPTIONIST_WITH_USER_COLUMNS}
         FROM receptionists r
         JOIN users u ON u.id = r.user_id
         WHERE r.shop_id = $1 ${includeDeleted ? '' : 'AND r.deleted_at IS NULL'}
         ORDER BY u.first_name, u.last_name`,
        [shopId]
    );

    return result.rows;
};

/**
 * Crea la cuenta (users) y el perfil (receptionists) de un recepcionista en una sola transacción.
 * La fila de users debe insertarse primero: el trigger check_user_role valida el rol al insertar en receptionists.
 * Correo y teléfono se verifican dentro de la transacción para que una carrera devuelva 409 y no un error de BD.
 */
export const createReceptionist = async (input: CreateReceptionistInput): Promise<ReceptionistWithUser> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [input.email]);
        if (emailCheck.rows.length > 0) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Email is already registered');
        }

        if (input.phone) {
            const phoneCheck = await client.query('SELECT id FROM users WHERE phone = $1', [input.phone]);
            if (phoneCheck.rows.length > 0) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Phone is already registered');
            }
        }

        const userResult = await client.query(
            `INSERT INTO users (role, email, phone, password_hash, first_name, last_name, birth_date, gender)
             VALUES ('receptionist', $1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                input.email,
                input.phone,
                input.passwordHash,
                input.firstName,
                input.lastName,
                input.birthDate,
                input.gender,
            ]
        );
        const userId: string = userResult.rows[0].id;

        await client.query(`INSERT INTO receptionists (user_id, shop_id, shift_id) VALUES ($1, $2, $3)`, [
            userId,
            input.shopId,
            input.shiftId,
        ]);

        const result = await client.query(
            `SELECT ${RECEPTIONIST_WITH_USER_COLUMNS}
             FROM receptionists r
             JOIN users u ON u.id = r.user_id
             WHERE r.user_id = $1`,
            [userId]
        );

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Reactiva a un recepcionista dado de baja sobrescribiendo sus datos personales, contraseña, sucursal y turno
 * con los nuevos, y limpiando deleted_at. Conserva el mismo user_id.
 */
export const reactivateReceptionist = async (
    userId: string,
    input: CreateReceptionistInput
): Promise<ReceptionistWithUser> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query('SELECT user_id FROM receptionists WHERE user_id = $1 FOR UPDATE', [userId]);

        if (input.phone) {
            const phoneCheck = await client.query('SELECT id FROM users WHERE phone = $1 AND id <> $2', [
                input.phone,
                userId,
            ]);
            if (phoneCheck.rows.length > 0) {
                throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Phone is already registered');
            }
        }

        await client.query(
            `UPDATE users
             SET phone = $1, password_hash = $2, first_name = $3, last_name = $4, birth_date = $5, gender = $6
             WHERE id = $7`,
            [input.phone, input.passwordHash, input.firstName, input.lastName, input.birthDate, input.gender, userId]
        );

        await client.query(
            `UPDATE receptionists SET shop_id = $1, shift_id = $2, deleted_at = NULL WHERE user_id = $3`,
            [input.shopId, input.shiftId, userId]
        );

        const result = await client.query(
            `SELECT ${RECEPTIONIST_WITH_USER_COLUMNS}
             FROM receptionists r
             JOIN users u ON u.id = r.user_id
             WHERE r.user_id = $1`,
            [userId]
        );

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
