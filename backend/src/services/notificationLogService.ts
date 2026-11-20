import {
    getUpcomingAppointmentReminders,
    getUpcomingAppointmentRemindersForTest,
    logReminderSent,
    logReminderFailed,
    type UpcomingReminderRow,
} from '../repositories/notificationLogRepository.js';
import { sendTelegramNotification } from './telegramBotService.js';
import { getBusinessTimezone } from '../utils/businessTime.js';

const buildMessage = (item: UpcomingReminderRow): string => {
    const dateFormatted = new Date(item.scheduled_start).toLocaleString('es-MX', {
        timeZone: getBusinessTimezone(),
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
    });

    const anticipation = item.trigger_type === 'reminder_24h' ? '24 horas' : '4 horas';

    return (
        `💈 *Recordatorio de Cita - Mr. Barber*\n\n` +
        `Hola *${item.client_first_name}*, te recordamos que tienes una cita programada en *${anticipation}*.\n\n` +
        `📅 *Fecha y hora:* ${dateFormatted}\n` +
        `Si necesitas reprogramar o cancelar, por favor hazlo desde nuestra plataforma con anticipación. ¡Te esperamos!`
    );
};

/**
 * Ejecuta la lógica de negocio de CU-43:
 * Recupera citas próximas y envía recordatorios o registra falta de contacto.
 * Devuelve cuántos recordatorios se procesaron. El runner de jobs (src/jobs) garantiza que no haya
 * ejecuciones solapadas, ni en esta instancia ni entre instancias (advisory lock).
 */
export const processReminders = async (): Promise<number> => {
    /* Obtener las citas que necesitan un recordatorio */
    const reminders = await getUpcomingAppointmentReminders();

    for (const item of reminders) {
        /* Sacar el telegramId */
        const telegramChatId = item.client_telegram_id?.trim();

        if (telegramChatId) {
            /* Construir el mensaje */
            try {
                const message = buildMessage(item);
                /* Cuando manda la notificación, regisra el id del mensaje */
                const messageId = await sendTelegramNotification(telegramChatId, message);

                await logReminderSent(item, messageId);
            } catch (err: unknown) {
                const reason = err instanceof Error ? err.message : 'Error desconocido al enviar por Telegram';
                console.error(`There was an error sending reminder for appointment ${item.appointment_id}:`, reason);

                await logReminderFailed(item, reason);
            }
        } else {
            await logReminderFailed(item, 'Client without a linked client_telegram_id');
        }
    }

    return reminders.length;
};

export interface TestReminderResult {
    totalFound: number;
    sent: number;
    withoutTelegram: number;
    failed: number;
}

/**
Envía recordatorios de prueba para citas próximas sin escribir en notifications_log.
No interfiere con el cron job automático.
 */
export const sendTestReminders = async (): Promise<TestReminderResult> => {
    const reminders = await getUpcomingAppointmentRemindersForTest();
    let sent = 0;
    let withoutTelegram = 0;
    let failed = 0;

    for (const item of reminders) {
        const telegramChatId = item.client_telegram_id?.trim();

        if (!telegramChatId) {
            withoutTelegram++;
            continue;
        }

        try {
            const testMessage =
                `🧪 *[MENSAJE DE PRUEBA]*\n` +
                `_Este es un envío manual de verificación; recibirás tu recordatorio oficial en el horario programado._\n\n` +
                buildMessage(item);

            await sendTelegramNotification(telegramChatId, testMessage);
            sent++;
        } catch (error: unknown) {
            failed++;
            console.error(
                `Could not send an appoinment ${item.appointment_id}:`,
                error
            );
        }
    }

    return {
        totalFound: reminders.length,
        sent,
        withoutTelegram,
        failed,
    };
};