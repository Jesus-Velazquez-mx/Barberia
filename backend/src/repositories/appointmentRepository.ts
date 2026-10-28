import db from '../connection/connection.js';
import type { Appointment, AppointmentStatus } from '../types/entities/appointment.interface.js';
import type { AppointmentService } from '../types/entities/appointmentService.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

const APPOINTMENT_COLUMNS = `id, shop_id, client_id, is_registered_client, guest_client_name, barber_id, is_walk_in,
    status, original_scheduled_start, scheduled_start, scheduled_end, checked_in_at, completed_at, cancelled_at,
    cancellation_reason, notes, is_reward_redemption, created_at, updated_at`;

export interface AppointmentListFilters {
    from: Date;
    to: Date;
    // Alcance del consultante: un cliente filtra por clientId; el personal, por las sucursales visibles.
    clientId?: string;
    shopIds?: string[];
    statuses?: AppointmentStatus[];
    isRegisteredClient?: boolean;
    barberId?: string;
}

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

export interface UpdateAppointmentInput {
    appointmentId: string;
    barberId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    notes: string | null;
    status: AppointmentStatus;
    // Servicios finales de la cita; los que ya estaban agendados conservan su snapshot de precio y duración.
    services: { serviceId: string; priceAtBooking: number; durationMinutesAtBooking: number }[];
}

/**
 * Citas que ocupan agenda (status scheduled / rescheduled / checked_in) de varios barberos que se
 * traslapan con el rango [from, to). Las cancelled / no_show / completed nunca bloquean.
 * `excludeAppointmentId` omite una cita (la que se está editando) para que no choque consigo misma.
 */
export const getBlockingAppointmentsByBarberIdsAndRange = async (
    barberIds: string[],
    from: Date,
    to: Date,
    excludeAppointmentId?: string
): Promise<Pick<Appointment, 'barber_id' | 'scheduled_start' | 'scheduled_end'>[]> => {
    if (barberIds.length === 0) return [];

    const result = await db.getPool().query(
        `SELECT barber_id, scheduled_start, scheduled_end FROM appointments
         WHERE barber_id = ANY($1::uuid[])
           AND status IN ('scheduled', 'rescheduled', 'checked_in')
           AND scheduled_start < $3 AND scheduled_end > $2
           AND ($4::uuid IS NULL OR id <> $4)`,
        [barberIds, from, to, excludeAppointmentId ?? null]
    );
    return result.rows;
};

/**
 * Busca una cita por su id.
 */
export const getAppointmentById = async (id: string): Promise<Appointment | null> => {
    const result = await db.getPool().query(`SELECT ${APPOINTMENT_COLUMNS} FROM appointments WHERE id = $1`, [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Citas cuyo inicio programado cae en [from, to] (ambos inclusivos), ordenadas por inicio.
 * Exige clientId o shopIds para que nunca se ejecute una consulta sin alcance; un shopIds
 * vacío es válido y no devuelve nada.
 */
export const getAppointments = async (filters: AppointmentListFilters): Promise<Appointment[]> => {
    if (filters.clientId === undefined && filters.shopIds === undefined) {
        throw new Error('getAppointments requires a clientId or shopIds scope');
    }

    const whereClauses: string[] = [];
    const values: unknown[] = [];
    const addClause = (clause: (placeholder: string) => string, value: unknown) => {
        values.push(value);
        whereClauses.push(clause(`$${values.length}`));
    };

    addClause((p) => `scheduled_start >= ${p}`, filters.from);
    addClause((p) => `scheduled_start <= ${p}`, filters.to);
    if (filters.clientId !== undefined) addClause((p) => `client_id = ${p}`, filters.clientId);
    if (filters.shopIds !== undefined) addClause((p) => `shop_id = ANY(${p}::uuid[])`, filters.shopIds);
    if (filters.statuses !== undefined) addClause((p) => `status = ANY(${p}::appointment_status[])`, filters.statuses);
    if (filters.isRegisteredClient !== undefined)
        addClause((p) => `is_registered_client = ${p}`, filters.isRegisteredClient);
    if (filters.barberId !== undefined) addClause((p) => `barber_id = ${p}`, filters.barberId);

    const result = await db.getPool().query(
        `SELECT ${APPOINTMENT_COLUMNS} FROM appointments
         WHERE ${whereClauses.join(' AND ')}
         ORDER BY scheduled_start ASC, id ASC`,
        values
    );
    return result.rows;
};

/**
 * Servicios agendados de varias citas en una sola consulta (evita N+1).
 */
export const getServicesByAppointmentIds = async (appointmentIds: string[]): Promise<AppointmentService[]> => {
    if (appointmentIds.length === 0) return [];

    const result = await db.getPool().query(
        `SELECT id, appointment_id, service_id, price_at_booking, duration_minutes_at_booking, created_at
         FROM appointment_services
         WHERE appointment_id = ANY($1::uuid[])
         ORDER BY created_at ASC, id ASC`,
        [appointmentIds]
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
               AND status IN ('scheduled', 'rescheduled', 'checked_in')
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

/**
 * Edita la cita y sincroniza sus servicios en una sola transacción.
 * Toma primero el candado de la cita (evita carreras contra cancelar / check-in u otra edición) y después
 * el de la fila del barbero destino, el mismo que usa createAppointmentWithServices, así que una edición
 * y una reserva simultáneas para ese barbero se serializan y solo una gana (la otra recibe 409).
 * Los servicios que se conservan no se tocan para no perder su snapshot de precio y duración.
 */
export const updateAppointmentWithServices = async (
    data: UpdateAppointmentInput
): Promise<{ appointment: Appointment; services: AppointmentService[] }> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const current = await client.query(
            `SELECT shop_id, status FROM appointments WHERE id = $1 FOR UPDATE`,
            [data.appointmentId]
        );
        if (current.rows.length === 0) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Appointment not found');
        }
        if (!['scheduled', 'rescheduled'].includes(current.rows[0].status)) {
            throw new ApiError(ApiErrorCode.CONFLICT, 'Only scheduled or rescheduled appointments can be edited');
        }

        const barber = await client.query(
            `SELECT id FROM barbers
             WHERE id = $1 AND shop_id = $2 AND deleted_at IS NULL AND is_accepting_bookings = true
             FOR UPDATE`,
            [data.barberId, current.rows[0].shop_id]
        );
        if (barber.rows.length === 0) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found or is not accepting bookings');
        }

        const overlap = await client.query(
            `SELECT 1 FROM appointments
             WHERE barber_id = $1
               AND id <> $4
               AND status IN ('scheduled', 'rescheduled', 'checked_in')
               AND scheduled_start < $3 AND scheduled_end > $2
             LIMIT 1`,
            [data.barberId, data.scheduledStart, data.scheduledEnd, data.appointmentId]
        );
        if (overlap.rows.length > 0) {
            throw new ApiError(ApiErrorCode.CONFLICT, 'Selected time slot is no longer available');
        }

        const result = await client.query(
            `UPDATE appointments
             SET barber_id = $2, scheduled_start = $3, scheduled_end = $4, notes = $5, status = $6
             WHERE id = $1
             RETURNING ${APPOINTMENT_COLUMNS}`,
            [data.appointmentId, data.barberId, data.scheduledStart, data.scheduledEnd, data.notes, data.status]
        );
        const appointment: Appointment = result.rows[0];

        const serviceIds = data.services.map((s) => s.serviceId);
        await client.query(
            `DELETE FROM appointment_services WHERE appointment_id = $1 AND NOT (service_id = ANY($2::uuid[]))`,
            [data.appointmentId, serviceIds]
        );
        await client.query(
            `INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking)
             SELECT $1, s.service_id, s.price, s.duration
             FROM unnest($2::uuid[], $3::numeric[], $4::int[]) AS s(service_id, price, duration)
             ON CONFLICT (appointment_id, service_id) DO NOTHING`,
            [
                data.appointmentId,
                serviceIds,
                data.services.map((s) => s.priceAtBooking),
                data.services.map((s) => s.durationMinutesAtBooking),
            ]
        );

        const services = await client.query(
            `SELECT id, appointment_id, service_id, price_at_booking, duration_minutes_at_booking, created_at
             FROM appointment_services
             WHERE appointment_id = $1
             ORDER BY created_at ASC, id ASC`,
            [data.appointmentId]
        );

        await client.query('COMMIT');
        return { appointment, services: services.rows };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Cancela la cita (status = cancelled, cancelled_at = now()) en una transacción.
 * Toma el candado de la cita, igual que la edición, para serializar contra edición, check-in u otra cancelación;
 * quien llegue segundo ve un estado ya no cancelable y recibe 409. Los servicios y is_reward_redemption no se tocan.
 */
export const cancelAppointmentById = async (
    appointmentId: string,
    reason: string | null
): Promise<{ appointment: Appointment; services: AppointmentService[] }> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const current = await client.query(`SELECT status FROM appointments WHERE id = $1 FOR UPDATE`, [appointmentId]);
        if (current.rows.length === 0) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Appointment not found');
        }
        if (!['scheduled', 'rescheduled'].includes(current.rows[0].status)) {
            throw new ApiError(ApiErrorCode.CONFLICT, 'Only scheduled or rescheduled appointments can be cancelled');
        }

        const result = await client.query(
            `UPDATE appointments
             SET status = 'cancelled', cancelled_at = now(), cancellation_reason = $2
             WHERE id = $1
             RETURNING ${APPOINTMENT_COLUMNS}`,
            [appointmentId, reason]
        );
        const services = await client.query(
            `SELECT id, appointment_id, service_id, price_at_booking, duration_minutes_at_booking, created_at
             FROM appointment_services
             WHERE appointment_id = $1
             ORDER BY created_at ASC, id ASC`,
            [appointmentId]
        );

        await client.query('COMMIT');
        return { appointment: result.rows[0], services: services.rows };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
