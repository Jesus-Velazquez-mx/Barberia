import db from '../connection/connection.js';

export type TriggerType = 'reminder_24h' | 'reminder_4h';

export interface UpcomingReminderRow {
    appointment_id: string;
    scheduled_start: Date;
    client_id: string;
    client_first_name: string;
    client_last_name: string;
    client_telegram_id: string | null;
    trigger_type: TriggerType;
}

/*
 Consulta la vista para obtener citas próximas junto con los datos del cliente
*/
export const getUpcomingAppointmentReminders = async (): Promise<UpcomingReminderRow[]> => {
    const pool = db.getPool();
    const query = `
        SELECT
            appointment_id,
            scheduled_start,
            client_id,
            client_first_name,
            client_last_name,
            client_telegram_id,
            trigger_type
        FROM vw_upcoming_appointment_reminders
        ORDER BY scheduled_start ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

/* Esta consulta no depende de notification_log, y sirve para evitar la necesidad de insertar nuevas citas para 
    probar el funcionamiento del envío de mensajes.
*/
export const getUpcomingAppointmentRemindersForTest = async (): Promise<UpcomingReminderRow[]> => {
    const pool = db.getPool();
    const query = `
        WITH candidate_appointments AS (
            SELECT
                a.id AS appointment_id,
                a.scheduled_start,
                c.user_id AS client_id,
                u.first_name AS client_first_name,
                u.last_name AS client_last_name,
                c.client_telegram_id,
                CASE
                    WHEN a.scheduled_start BETWEEN (NOW() + INTERVAL '23 hours 30 minutes')
                                               AND (NOW() + INTERVAL '24 hours 15 minutes')
                        THEN 'reminder_24h'
                    WHEN a.scheduled_start BETWEEN (NOW() + INTERVAL '3 hours 30 minutes')
                                               AND (NOW() + INTERVAL '4 hours 15 minutes')
                        THEN 'reminder_4h'
                    ELSE NULL
                END AS trigger_type
            FROM appointments a
            JOIN clients c ON c.user_id = a.client_id
            JOIN users u ON u.id = c.user_id
            WHERE a.is_registered_client = true
              AND a.is_walk_in = false
              AND a.status IN ('scheduled', 'rescheduled')
        )
        SELECT
            appointment_id,
            scheduled_start,
            client_id,
            client_first_name,
            client_last_name,
            client_telegram_id,
            trigger_type
        FROM candidate_appointments
        WHERE trigger_type IS NOT NULL
        ORDER BY scheduled_start ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

/*
 Recordatorio enviado
*/
export const logReminderSent = async (
    appointmentId: string,
    clientId: string,
    triggerType: TriggerType,
    providerMessageId?: string
): Promise<void> => {
    const pool = db.getPool();
    const query = `
        INSERT INTO notifications_log (
            appointment_id,
            client_id,
            status,
            trigger_type,
            scheduled_for,
            sent_at,
            provider_message_id
        )
        VALUES ($1, $2, 'sent', $3, NOW(), NOW(), $4)
        ON CONFLICT (appointment_id, trigger_type) DO NOTHING;
    `;
    await pool.query(query, [
        appointmentId,
        clientId,
        triggerType,
        providerMessageId ?? null,
    ]);
};

/*
 Recordatorio NO enviado
*/
export const logReminderFailed = async (
    appointmentId: string,
    clientId: string,
    triggerType: TriggerType,
    failureReason: string
): Promise<void> => {
    const pool = db.getPool();
    const query = `
        INSERT INTO notifications_log (
            appointment_id,
            client_id,
            status,
            trigger_type,
            scheduled_for,
            failure_reason
        )
        VALUES ($1, $2, 'failed', $3, NOW(), $4)
        ON CONFLICT (appointment_id, trigger_type) DO NOTHING;
    `;
    await pool.query(query, [
        appointmentId,
        clientId,
        triggerType,
        failureReason,
    ]);
};