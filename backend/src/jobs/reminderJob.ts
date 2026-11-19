import { processReminders } from '../services/notificationLogService.js';
import type { Job } from './types.js';

/**
 * Envía los recordatorios de citas por Telegram (CU-43). Las ventanas de envío las calcula la vista
 * `vw_upcoming_appointment_reminders` con `NOW()` de la BD, por eso este job no usa `ctx.now`.
 */
export const reminderJob: Job = {
    name: 'send-appointment-reminders',
    run: async () => ({ affected: await processReminders() }),
};
