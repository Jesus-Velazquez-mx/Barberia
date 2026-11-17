import cron from 'node-cron';
import { processReminders } from '../services/notificationLogService.js';

export const startReminderScheduler = () => {
    /* Se ejecuta cada 15 minutos (minuto 0, 15, 30, 45 de cada hora) */
    cron.schedule('*/15 * * * *', async () => {
        console.log('Looking for new reminders...');
        await processReminders();
    });

    console.log('Reminder schedualer started (Every 15 minutes)');
};