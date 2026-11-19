import { Bot } from 'node-telegram-bot-api';
import { ApiError } from '../errors/ApiError.js';
import { linkClientTelegram } from './clientService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let botInstance: Bot | null = null;
let pollingPromise: Promise<void> | null = null;

export const initTelegramBot = () => {
    if (botInstance) return botInstance;

    const token = process.env.TELEGRAM_API_TOKEN;
    if (!token) {
        console.warn('TELEGRAM_API_TOKEN is missing.');
        return null;
    }

    /* el botInstance es el que manda los mensajes. Ocupa su api token para crearse*/
    botInstance = new Bot(token);

    botInstance.command('start', async (ctx) => {
        const chatId = ctx.chat?.id.toString();
        if (!chatId) return;

        /* Extrae el UUID si viene después de /start (ej: "/start <uuid>") */
        const text = ctx.message?.text?.trim() ?? '';
        const parts = text.split(/\s+/);
        const clientId = parts[1]?.trim() ?? null;

        /* Mensaje si entró al bot sin el ID del cliente */
        if (!clientId) {
            await ctx.reply(
                '💈 ¡Bienvenido a *Mr. Barber*!\n\n' +
                'Para activar tus recordatorios, entra a tu perfil en la web y escanea tu código QR en la sección *Recordatorios*.',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        /* Mensaje si el ID del cliente no es un UUID válido */
        if (!UUID_REGEX.test(clientId)) {
            await ctx.reply('El enlace de vinculación no es válido. Genera un nuevo código QR desde tu cuenta.');
            return;
        }

        try {
            const client = await linkClientTelegram(clientId, chatId);
            /* Si logra vincularse */
            await ctx.reply(
                `✅ ¡Listo, *${client.first_name}*!\n\n` +
                `Tu cuenta de Telegram quedó vinculada con *Mr. Barber*.\n` +
                `Recibirás un aviso automático *24 horas* y *4 horas* antes de cada cita.`,
                { parse_mode: 'Markdown' }
            );
        } catch (error: unknown) {
            if (error instanceof ApiError && error.code === 404) {
                /* Si no logra vincularse */
                await ctx.reply('❌ No encontramos tu cuenta de cliente en el sistema.');
                return;
            }

            console.error('[TelegramBotService] Error vinculando cliente:', error);
            await ctx.reply('⚠️ Ocurrió un error al vincular tu cuenta. Intenta escanear el código nuevamente.');
        }
    });

    botInstance.catch((err) => {
        console.error('[TelegramBotService] Error en el bot:', err);
    });

    pollingPromise = botInstance.startPolling().catch((err: unknown) => {
        console.error('[TelegramBotService] Polling stopped with error:', err);
    });
    console.log('Listener is active');
    return botInstance;
};

/* Detiene el long polling (apagado ordenado del servidor). */
export const stopTelegramBot = async (): Promise<void> => {
    if (!botInstance) return;
    botInstance.stop();
    await pollingPromise;
    botInstance = null;
    pollingPromise = null;
};

export const sendTelegramNotification = async (chatId: string, message: string): Promise<string> => {
    if (!botInstance) {
        throw new Error('There is no bot running');
    }

    const sentMessage = await botInstance.api.sendMessage({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
    });

    return sentMessage.message_id.toString();
};