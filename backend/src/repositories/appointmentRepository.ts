import db from '../connection/connection.js';
import type { Appointment } from '../types/entities/appointment.interface.js';
import type { AppointmentService } from '../types/entities/appointmentService.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

export interface CreateAppointmentInput {
    shopId: string;
    barberId: string;
    clientId: string | null;
    guestClientName: string | null;
    scheduledStart: Date;
    scheduledEnd: Date;
    notes: string | null;
    services: { serviceId: string; priceAtBooking: number; durationMinutesAtBooking: number }[];
}

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

/**
 * Crea la cita y sus servicios en una sola transacción.
 * Evita que dos reservas simultáneas ocupen el mismo horario de un barbero:
 * SELECT ... FOR UPDATE bloquea la fila del barbero (el mismo candado que toma
 * softDeleteBarberById), así que las reservas concurrentes para ese barbero se
 * serializan. La segunda espera a que la primera confirme y, ya con el candado,
 * su verificación de traslape sí ve la cita recién insertada y se rechaza con 409.
 * Cualquier otra escritura que mueva citas de un barbero debe tomar este mismo candado.
 */
export const createAppointmentWithServices = async (
    data: CreateAppointmentInput
): Promise<{ appointment: Appointment; services: AppointmentService[] }> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const barber = await client.query(
            `SELECT id FROM barbers
             WHERE id = $1 AND shop_id = $2 AND deleted_at IS NULL AND is_accepting_bookings = true
             FOR UPDATE`,
            [data.barberId, data.shopId]
        );
        if (barber.rows.length === 0) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found or is not accepting bookings');
        }

        const overlap = await client.query(
            `SELECT 1 FROM appointments
             WHERE barber_id = $1
               AND status IN ('scheduled', 'checked_in')
               AND scheduled_start < $3 AND scheduled_end > $2
             LIMIT 1`,
            [data.barberId, data.scheduledStart, data.scheduledEnd]
        );
        if (overlap.rows.length > 0) {
            throw new ApiError(ApiErrorCode.USER_ALREADY_EXISTS, 'Selected time slot is no longer available');
        }

        const result = await client.query(
            `INSERT INTO appointments (shop_id, client_id, is_registered_client, guest_client_name, barber_id,
                                       scheduled_start, scheduled_end, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, shop_id, client_id, is_registered_client, guest_client_name, barber_id, is_walk_in,
                       status, scheduled_start, scheduled_end, checked_in_at, completed_at, cancelled_at,
                       cancellation_reason, notes, is_reward_redemption, created_at, updated_at`,
            [
                data.shopId,
                data.clientId,
                data.clientId !== null,
                data.guestClientName,
                data.barberId,
                data.scheduledStart,
                data.scheduledEnd,
                data.notes,
            ]
        );
        const appointment: Appointment = result.rows[0];

        const services: AppointmentService[] = [];
        for (const service of data.services) {
            const inserted = await client.query(
                `INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, appointment_id, service_id, price_at_booking, duration_minutes_at_booking, created_at`,
                [appointment.id, service.serviceId, service.priceAtBooking, service.durationMinutesAtBooking]
            );
            services.push(inserted.rows[0]);
        }

        await client.query('COMMIT');
        return { appointment, services };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
