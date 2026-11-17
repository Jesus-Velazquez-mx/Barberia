import db from '../connection/connection.js';

export type TriggerType = 'reminder_24h' | 'reminder_4h';

export interface UpcomingReminderRow {
    appointment_id: string;
    scheduled_start: Date;
    scheduled_for: Date;
    client_id: string;
    client_first_name: string;
    client_last_name: string;
    client_telegram_id: string | null;
    trigger_type: TriggerType;
}

const REMINDER_COLUMNS = `
    appointment_id,
    scheduled_start,
    scheduled_for,
    client_id,
    client_first_name,
    client_last_name,
    client_telegram_id,
    trigger_type
`;

/*
 Consulta la vista para obtener citas próximas sin recordatorio enviado junto con los datos del cliente
*/
export const getUpcomingAppointmentReminders = async (): Promise<UpcomingReminderRow[]> => {
    const result = await db
        .getPool()
        .query(`SELECT ${REMINDER_COLUMNS} FROM vw_upcoming_appointment_reminders ORDER BY scheduled_start ASC;`);
    return result.rows;
};

/* Esta consulta no depende de notification_log, y sirve para evitar la necesidad de insertar nuevas citas para
    probar el funcionamiento del envío de mensajes.
*/
export const getUpcomingAppointmentRemindersForTest = async (): Promise<UpcomingReminderRow[]> => {
    const result = await db
        .getPool()
        .query(`SELECT ${REMINDER_COLUMNS} FROM vw_appointment_reminder_candidates ORDER BY scheduled_start ASC;`);
    return result.rows;
};

/*
 Recordatorio enviado. Si existía un intento fallido para el mismo envío, lo marca como enviado.
*/
export const logReminderSent = async (
    item: Pick<UpcomingReminderRow, 'appointment_id' | 'client_id' | 'trigger_type' | 'scheduled_for'>,
    providerMessageId?: string
): Promise<void> => {
    const query = `
        INSERT INTO notifications_log (
            appointment_id, client_id, status, trigger_type, scheduled_for, sent_at, provider_message_id
        )
        VALUES ($1, $2, 'sent', $3, $4, NOW(), $5)
        ON CONFLICT (appointment_id, trigger_type, scheduled_for) DO UPDATE
        SET status = 'sent',
            sent_at = NOW(),
            provider_message_id = EXCLUDED.provider_message_id,
            failure_reason = NULL;
    `;
    await db
        .getPool()
        .query(query, [
            item.appointment_id,
            item.client_id,
            item.trigger_type,
            item.scheduled_for,
            providerMessageId ?? null,
        ]);
};

/*
 Recordatorio NO enviado. Un fallo repetido incrementa retry_count; nunca sobrescribe un envío exitoso.
*/
export const logReminderFailed = async (
    item: Pick<UpcomingReminderRow, 'appointment_id' | 'client_id' | 'trigger_type' | 'scheduled_for'>,
    failureReason: string
): Promise<void> => {
    const query = `
        INSERT INTO notifications_log (
            appointment_id, client_id, status, trigger_type, scheduled_for, failure_reason
        )
        VALUES ($1, $2, 'failed', $3, $4, $5)
        ON CONFLICT (appointment_id, trigger_type, scheduled_for) DO UPDATE
        SET failure_reason = EXCLUDED.failure_reason,
            retry_count = notifications_log.retry_count + 1
        WHERE notifications_log.status <> 'sent';
    `;
    await db
        .getPool()
        .query(query, [item.appointment_id, item.client_id, item.trigger_type, item.scheduled_for, failureReason]);
};
