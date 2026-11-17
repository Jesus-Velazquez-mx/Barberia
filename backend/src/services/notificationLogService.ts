import {
    getUpcomingAppointmentReminders,
    getUpcomingAppointmentRemindersForTest,
    logReminderSent,
    logReminderFailed,
    type UpcomingReminderRow,
} from '../repositories/notificationLogRepository.js';
import { sendTelegramNotification } from './telegramBotService.js';

let isProcessing = false;

const buildMessage = (item: UpcomingReminderRow): string => {
    const dateFormatted = new Date(item.scheduled_start).toLocaleString('es-MX', {
        timeZone: 'America/Mazatlan',
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
 */
export const processReminders = async (): Promise<void> => {
    if (isProcessing) {
        console.warn('There is a reminder process running. Skipping...');
        return;
    }

    isProcessing = true;

    try {
        /* Obtener las citas que necesitan un recordatorio */
        const reminders = await getUpcomingAppointmentReminders();
        if (reminders.length === 0) return;

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
                    const reason =
                        err instanceof Error ? err.message : 'Error desconocido al enviar por Telegram';
                    console.error(`There was an error sending reminder for appointment ${item.appointment_id}:`, reason);

                    await logReminderFailed(item, reason);
                }
            } else {
                await logReminderFailed(item, 'Client without a linked client_telegram_id');
            }
        }
    } catch (error) {
        console.error('There was an error while processing reminders: ', error);
    } finally {
        isProcessing = false;
    }
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