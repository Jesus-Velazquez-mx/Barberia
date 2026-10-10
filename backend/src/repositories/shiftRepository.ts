import db from '../connection/connection.js';
import type { Shift } from '../types/entities/shift.interface.js';

/**
 * Catálogo completo de turnos (son pocas filas fijas: morning / afternoon).
 */
export const getAllShifts = async (): Promise<Shift[]> => {
    const result = await db
        .getPool()
        .query(`SELECT id, name, start_time, end_time, created_at, updated_at FROM shifts`);
    return result.rows;
};
