import db from '../connection/connection.js';
import type { Barber } from '../types/entities/barber.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

export interface UpdateBarberInput {
    userId: string;
    bio?: string;
    isAcceptingBookings?: boolean;
}

/**
 * Actualiza el perfil (bio / is_accepting_bookings) de un barbero. Solo modifica las
 * columnas presentes en `fields`. AND deleted_at IS NULL evita que un token vigente
 * pueda editar un barbero que ya fue dado de baja.
 */
export const updateBarberProfileById = async (fields: UpdateBarberInput): Promise<Barber> => {
    const pool = db.getPool();

    const setClauses: string[] = [];
    const values: unknown[] = [];

    const columnByField: [keyof Omit<UpdateBarberInput, 'userId'>, string][] = [
        ['bio', 'bio'],
        ['isAcceptingBookings', 'is_accepting_bookings'],
    ];

    for (const [field, column] of columnByField) {
        const value = fields[field];
        if (value !== undefined) {
            values.push(value);
            setClauses.push(`${column} = $${values.length}`);
        }
    }

    values.push(fields.userId);
    const result = await pool.query(
        `UPDATE barbers SET ${setClauses.join(', ')}
         WHERE user_id = $${values.length} AND deleted_at IS NULL
         RETURNING user_id, shop_id, shift_id, bio, is_accepting_bookings, deleted_at`,
        values
    );

    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }

    return result.rows[0];
};
