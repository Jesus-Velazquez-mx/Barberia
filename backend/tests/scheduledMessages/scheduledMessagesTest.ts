import dotenv from 'dotenv';
import { Bot } from "node-telegram-bot-api";
dotenv.config();

const bot = new Bot(process.env.TELEGRAM_API_TOKEN!);
const TEST_CHAT_ID = '1042727774';

async function sendTestMessage() {
    try {
        await bot.api.sendMessage({
            chat_id: TEST_CHAT_ID,
            text: '💈 *Mr. Barber:* Prueba de conexión exitosa desde ExpressJS.',
            parse_mode: 'Markdown',
        });
        console.log('✅ Mensaje de prueba enviado correctamente.');
    } catch (error) {
        console.error('❌ Error enviando mensaje:', (error as Error).message);
    }
}

sendTestMessage();