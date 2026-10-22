import db from '../connection/connection.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import type { Shift } from '../types/entities/shift.interface.js';

export type CreateShiftInput = { name: string; start_time: string; end_time: string };
export type UpdateShiftInput = Partial<CreateShiftInput>;

/** Resultado de intentar borrar un turno. */
export type DeleteShiftResult = 'deleted' | 'not_found' | 'last_shift' | 'has_staff';

const SHIFT_COLUMNS = 'id, name, start_time, end_time, created_at, updated_at';

/**
 * Catálogo completo de turnos, ordenado por hora de inicio.
 */
export const getAllShifts = async (): Promise<Shift[]> => {
    const result = await db
        .getPool()
        .query(`SELECT ${SHIFT_COLUMNS} FROM shifts ORDER BY start_time ASC, name ASC`);
    return result.rows;
};

/**
 * Busca un turno por su ID.
 */
export const getShiftById = async (id: string): Promise<Shift | null> => {
    const result = await db.getPool().query(`SELECT ${SHIFT_COLUMNS} FROM shifts WHERE id = $1`, [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca un turno por nombre (sin distinguir mayúsculas/minúsculas).
 */
export const getShiftByName = async (name: string): Promise<Shift | null> => {
    const result = await db
        .getPool()
        .query(`SELECT ${SHIFT_COLUMNS} FROM shifts WHERE LOWER(name) = LOWER($1)`, [name]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca un turno con exactamente el mismo horario de inicio y fin.
 */
export const getShiftByTimes = async (startTime: string, endTime: string): Promise<Shift | null> => {
    const result = await db
        .getPool()
        .query(`SELECT ${SHIFT_COLUMNS} FROM shifts WHERE start_time = $1::time AND end_time = $2::time`, [
            startTime,
            endTime,
        ]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Inserta un nuevo turno.
 */
export const createShift = async (data: CreateShiftInput): Promise<Shift> => {
    const result = await db.getPool().query(
        `INSERT INTO shifts (name, start_time, end_time)
         VALUES ($1, $2, $3)
         RETURNING ${SHIFT_COLUMNS}`,
        [data.name, data.start_time, data.end_time]
    );
    return result.rows[0];
};

/**
 * Actualiza los campos especificados de un turno existente.
 */
export const updateShift = async (id: string, fields: UpdateShiftInput): Promise<Shift> => {
    const pool = db.getPool();
    const columnByField: (keyof UpdateShiftInput)[] = ['name', 'start_time', 'end_time'];

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const field of columnByField) {
        const value = fields[field];
        if (value !== undefined) {
            values.push(value);
            setClauses.push(`${field} = $${values.length}`);
        }
    }

    if (setClauses.length === 0) {
        const existing = await getShiftById(id);
        if (!existing) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shift not found');
        return existing;
    }

    values.push(id);
    const result = await pool.query(
        `UPDATE shifts
         SET ${setClauses.join(', ')}
         WHERE id = $${values.length}
         RETURNING ${SHIFT_COLUMNS}`,
        values
    );
    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shift not found');
    }
    return result.rows[0];
};

/**
 * Borra un turno solo si existe, no es el único turno y ningún barbero ni recepcionista lo tiene asignado
 * (se cuentan también los dados de baja lógicamente, porque la FK ON DELETE RESTRICT los incluye).
 *
 * Todo ocurre en una transacción con candado sobre todas las filas de shifts: así dos borrados
 * concurrentes se serializan y no pueden dejar la tabla sin turnos.
 */
export const deleteShiftIfAllowed = async (id: string): Promise<DeleteShiftResult> => {
    const client = await db.getPool().connect();

    try {
        await client.query('BEGIN');

        const locked = await client.query<{ id: string }>('SELECT id FROM shifts FOR UPDATE');

        if (!locked.rows.some((row) => row.id === id)) {
            await client.query('ROLLBACK');
            return 'not_found';
        }

        if (locked.rows.length <= 1) {
            await client.query('ROLLBACK');
            return 'last_shift';
        }

        const assigned = await client.query(
            `SELECT EXISTS (SELECT 1 FROM barbers WHERE shift_id = $1)
                 OR EXISTS (SELECT 1 FROM receptionists WHERE shift_id = $1) AS in_use`,
            [id]
        );
        if (assigned.rows[0].in_use) {
            await client.query('ROLLBACK');
            return 'has_staff';
        }

        await client.query('DELETE FROM shifts WHERE id = $1', [id]);
        await client.query('COMMIT');
        return 'deleted';
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
