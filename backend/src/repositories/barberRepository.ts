import db from '../connection/connection.js';
import type { Barber } from '../types/entities/barber.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

export interface UpdateBarberInput {
    id: string;
    bio?: string;
    isAcceptingBookings?: boolean;
}

/**
 * Busca un barbero por su id. No filtra por deleted_at: los llamadores que
 * necesitan excluir barberos dados de baja lo hacen antes de invocar esta función.
 */
export const getBarberById = async (id: string): Promise<Barber | null> => {
    const pool = db.getPool();

    const result = await pool.query(
        `SELECT id, first_name, last_name, email, phone, shop_id, shift_id, bio,
                is_accepting_bookings, birth_date, gender, deleted_at, created_at, updated_at
         FROM barbers WHERE id = $1`,
        [id]
    );

    return result.rows.length ? result.rows[0] : null;
};

/**
 * Actualiza el perfil (bio / is_accepting_bookings) de un barbero. Solo modifica las
 * columnas presentes en `fields`. AND deleted_at IS NULL evita editar un barbero
 * que ya fue dado de baja.
 */
export const updateBarberProfileById = async (fields: UpdateBarberInput): Promise<Barber> => {
    const pool = db.getPool();

    const setClauses: string[] = [];
    const values: unknown[] = [];

    const columnByField: [keyof Omit<UpdateBarberInput, 'id'>, string][] = [
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

    values.push(fields.id);
    const result = await pool.query(
        `UPDATE barbers SET ${setClauses.join(', ')}
         WHERE id = $${values.length} AND deleted_at IS NULL
         RETURNING id, first_name, last_name, email, phone, shop_id, shift_id, bio,
                   is_accepting_bookings, deleted_at, created_at, updated_at`,
        values
    );

    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }

    return result.rows[0];
};

/**
 * Da de baja lógicamente a un barbero (deleted_at = NOW()). No hace nada si el
 * barbero no existe o ya estaba dado de baja; el llamador es responsable de
 * confirmar su existencia antes (ver deleteBarber en barberService.ts).
 *
 * SELECT ... FOR UPDATE bloquea la fila del barbero antes de dar de baja: así,
 * una reserva concurrente para ese mismo barbero (que deberá tomar el mismo
 * candado antes de insertar la cita) no puede colarse entre la verificación de
 * trg_barbers_check_deletable y este UPDATE. Sin el candado, ambas transacciones
 * podrían no ver los cambios de la otra bajo READ COMMITTED y confirmarse las
 * dos, dejando una cita agendada para un barbero ya dado de baja.
 */
export const softDeleteBarberById = async (id: string): Promise<void> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query('SELECT id FROM barbers WHERE id = $1 FOR UPDATE', [id]);

        await client.query(`UPDATE barbers SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [id]);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Obtiene los barberos de una sucursal específica que están activos y aceptan reservas.
 * Se excluyen barberos dados de baja lógicamente y los que tienen is_accepting_bookings = false.
 */
export const getActiveBarbersByShop = async (shopId: string) => {
    const pool = db.getPool();
    const query = `
        SELECT id, first_name, last_name, email, phone, shop_id, shift_id, bio, 
               is_accepting_bookings, created_at, updated_at
        FROM barbers 
        WHERE shop_id = $1 
          AND deleted_at IS NULL 
          AND is_accepting_bookings = true
    `;
    const result = await pool.query(query, [shopId]);
    return result.rows;
};
