import db from '../connection/connection.js';
import type { Appointment } from '../types/entities/appointment.interface.js';

/**
 * Citas que ocupan agenda (status scheduled / checked_in) de varios barberos que se
 * traslapan con el rango [from, to). Las cancelled / no_show / completed nunca bloquean.
 */
export const getBlockingAppointmentsByBarberIdsAndRange = async (
    barberIds: string[],
    from: Date,
    to: Date
): Promise<Pick<Appointment, 'barber_id' | 'scheduled_start' | 'scheduled_end'>[]> => {
    if (barberIds.length === 0) return [];

    const result = await db.getPool().query(
        `SELECT barber_id, scheduled_start, scheduled_end FROM appointments
         WHERE barber_id = ANY($1::uuid[])
           AND status IN ('scheduled', 'checked_in')
           AND scheduled_start < $3 AND scheduled_end > $2`,
        [barberIds, from, to]
    );
    return result.rows;
};
