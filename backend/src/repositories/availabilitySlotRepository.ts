import db from '../connection/connection.js';
import type { AvailabilitySlot } from '../types/entities/availabilitySlot.interface.js';

const SLOT_COLUMNS = `id, barber_id, shop_id, day_of_week, start_time, end_time, is_active, created_at, updated_at`;

/**
 * Slots activos de la plantilla semanal de un barbero para un día de la semana.
 * day_of_week sigue la convención de la BD: 0 = domingo.
 */
export const getActiveSlotsByBarberAndDay = async (
    barberId: string,
    dayOfWeek: number
): Promise<AvailabilitySlot[]> => {
    const result = await db.getPool().query(
        `SELECT ${SLOT_COLUMNS} FROM availability_slots
         WHERE barber_id = $1 AND day_of_week = $2 AND is_active = true
         ORDER BY start_time`,
        [barberId, dayOfWeek]
    );
    return result.rows;
};

/**
 * Variante por lotes: slots activos de varios barberos en una sola consulta (evita N+1).
 * Cada fila conserva su barber_id para que el llamador la atribuya al barbero correcto.
 */
export const getActiveSlotsByBarberIdsAndDay = async (
    barberIds: string[],
    dayOfWeek: number
): Promise<AvailabilitySlot[]> => {
    if (barberIds.length === 0) return [];

    const result = await db.getPool().query(
        `SELECT ${SLOT_COLUMNS} FROM availability_slots
         WHERE barber_id = ANY($1::uuid[]) AND day_of_week = $2 AND is_active = true
         ORDER BY barber_id, start_time`,
        [barberIds, dayOfWeek]
    );
    return result.rows;
};
