import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import connection from '../src/connection/connection.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';
import {
    generateUniqueEmail as uniqueEmail,
    generateUniquePhone,
    generateUniqueName as uniqueName,
} from './helpers/uniqueValues.js';
import { getSeededShiftId } from './helpers/availabilityFixtures.js';

jest.unstable_mockModule('../src/services/telegramBotService.js', () => ({
    initTelegramBot: jest.fn(),
    sendTelegramNotification: jest.fn(),
}));

const [{ default: router }, { linkClientTelegram }, { processReminders }, { sendTelegramNotification }] =
    await Promise.all([
        import('../src/routes/routes.js'),
        import('../src/services/clientService.js'),
        import('../src/services/notificationLogService.js'),
        import('../src/services/telegramBotService.js'),
    ]);

const mockedSendTelegram = jest.mocked(sendTelegramNotification);
const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const createdUserIds: string[] = [];
const createdShopIds: string[] = [];
const createdBarberIds: string[] = [];
const createdAppointmentIds: string[] = [];

const generateEmail = (prefix = 'notif_test') => uniqueEmail(prefix);
const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

const insertUser = async (role: UserRole, firstName = 'Fixture'): Promise<{ id: string; email: string }> => {
    const email = generateEmail(role);
    const phone = generateUniquePhone();
    const result = await getPool().query(
        `INSERT INTO users (role, email, phone, password_hash, first_name, last_name, birth_date, gender)
         VALUES ($1, $2, $3, 'unused_hash', $4, 'User', '1990-01-01', 'other') RETURNING id`,
        [role, email, phone, firstName]
    );
    const id = result.rows[0].id;
    createdUserIds.push(id);
    return { id, email };
};

const insertManager = async () => {
    const user = await insertUser('manager');
    await getPool().query('INSERT INTO managers (user_id, title) VALUES ($1, $2)', [user.id, 'Manager']);
    return user;
};

const insertShop = async (managerId: string): Promise<string> => {
    const result = await getPool().query(`INSERT INTO shops (name, manager_id) VALUES ($1, $2) RETURNING id`, [
        uniqueName('Shop'),
        managerId,
    ]);
    const id = result.rows[0].id;
    createdShopIds.push(id);
    return id;
};

const insertReceptionist = async (shopId: string) => {
    const user = await insertUser('receptionist');
    const shiftId = await getSeededShiftId();
    await getPool().query(`INSERT INTO receptionists (user_id, shop_id, shift_id) VALUES ($1, $2, $3)`, [
        user.id,
        shopId,
        shiftId,
    ]);
    return user;
};

const insertBarber = async (shopId: string): Promise<string> => {
    const shiftId = await getSeededShiftId();
    const result = await getPool().query(
        `INSERT INTO barbers (first_name, last_name, email, phone, birth_date, gender, shop_id, shift_id)
         VALUES ('Barber', 'Test', $1, $2, '1988-05-10', 'male', $3, $4) RETURNING id`,
        [generateEmail('barber'), generateUniquePhone(), shopId, shiftId]
    );
    const id = result.rows[0].id;
    createdBarberIds.push(id);
    return id;
};

const insertClient = async (telegramId: string | null = null, firstName = 'Cliente') => {
    const user = await insertUser('client', firstName);
    await getPool().query(`INSERT INTO clients (user_id, client_telegram_id) VALUES ($1, $2)`, [user.id, telegramId]);
    return user;
};

const insertAppointmentInOffset = async (params: {
    shopId: string;
    barberId: string;
    clientId: string;
    hoursFromNow: number;
    status?: 'scheduled' | 'rescheduled' | 'cancelled';
}): Promise<string> => {
    const result = await getPool().query(
        `INSERT INTO appointments (
            shop_id,
            client_id,
            is_registered_client,
            barber_id,
            is_walk_in,
            status,
            original_scheduled_start,
            scheduled_start,
            scheduled_end
        )
        VALUES (
            $1,
            $2,
            true,
            $3,
            false,
            $4,
            NOW() + ($5 || ' hours')::interval,
            NOW() + ($5 || ' hours')::interval,
            NOW() + ($5 || ' hours')::interval + INTERVAL '45 minutes'
        )
        RETURNING id`,
        [params.shopId, params.clientId, params.barberId, params.status ?? 'scheduled', params.hoursFromNow.toString()]
    );
    const id = result.rows[0].id;
    createdAppointmentIds.push(id);
    return id;
};

beforeAll(async () => {
    await connectDB();
});

beforeEach(() => {
    mockedSendTelegram.mockReset();
    mockedSendTelegram.mockResolvedValue('msg_telegram_12345');
});

afterAll(async () => {
    const pool = getPool();

    if (createdAppointmentIds.length > 0) {
        await pool.query('DELETE FROM notifications_log WHERE appointment_id = ANY($1)', [createdAppointmentIds]);
        await pool.query('DELETE FROM appointments WHERE id = ANY($1)', [createdAppointmentIds]);
    }
    if (createdBarberIds.length > 0) {
        await pool.query('DELETE FROM barbers WHERE id = ANY($1)', [createdBarberIds]);
    }
    if (createdUserIds.length > 0) {
        await pool.query('DELETE FROM appointments WHERE client_id = ANY($1)', [createdUserIds]);
        await pool.query('DELETE FROM receptionists WHERE user_id = ANY($1)', [createdUserIds]);
        if (createdShopIds.length > 0) {
            await pool.query('DELETE FROM shops WHERE id = ANY($1)', [createdShopIds]);
        }
        await pool.query('DELETE FROM managers WHERE user_id = ANY($1)', [createdUserIds]);
        await pool.query('DELETE FROM clients WHERE user_id = ANY($1)', [createdUserIds]);
        await pool.query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }

    await closeDB();
});

describe('Recordatorios de Citas CU-43 (/api/notifications/reminders)', () => {
    let managerUser: { id: string; email: string };
    let receptionistUser: { id: string; email: string };
    let managerToken: string;
    let receptionistToken: string;
    let shopId: string;
    let barberId: string;

    beforeAll(async () => {
        managerUser = await insertManager();
        shopId = await insertShop(managerUser.id);
        receptionistUser = await insertReceptionist(shopId);
        barberId = await insertBarber(shopId);

        managerToken = mintToken(managerUser.id, 'manager', managerUser.email);
        receptionistToken = mintToken(receptionistUser.id, 'receptionist', receptionistUser.email);
    });


    describe('Vinculación de cuenta Telegram', () => {
        test('Debe guardar client_telegram_id cuando el cliente vincula su cuenta', async () => {
            const client = await insertClient(null, 'Mateo');

            await linkClientTelegram(client.id, '987654321');

            const dbCheck = await getPool().query('SELECT client_telegram_id FROM clients WHERE user_id = $1', [
                client.id,
            ]);
            expect(dbCheck.rows[0].client_telegram_id).toBe('987654321');
        });

        test('Debe lanzar ApiError 404 si el clientId del QR no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            await expect(linkClientTelegram(fakeId, '987654321')).rejects.toMatchObject({
                code: 404,
            });
        });
    });

    describe('POST /api/notifications/reminders/test (Envío manual sin bitácora)', () => {
        test('MANAGER puede disparar recordatorios de prueba (200) sin escribir en notifications_log', async () => {
            const linkedClient = await insertClient('111222333', 'Sofía');
            const appointmentId = await insertAppointmentInOffset({
                shopId,
                barberId,
                clientId: linkedClient.id,
                hoursFromNow: 24,
            });

            const response = await request(app)
                .post('/api/notifications/reminders/test')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.sent).toBeGreaterThanOrEqual(1);

            expect(mockedSendTelegram).toHaveBeenCalledWith(
                '111222333',
                expect.stringContaining('[MENSAJE DE PRUEBA]')
            );

            const logCheck = await getPool().query('SELECT * FROM notifications_log WHERE appointment_id = $1', [
                appointmentId,
            ]);
            expect(logCheck.rows.length).toBe(0);

            await getPool().query('DELETE FROM appointments WHERE id = $1', [appointmentId]);
        });

        test('MANAGER puede enviar una prueba aunque el recordatorio automático ya esté registrado', async () => {
            const linkedClient = await insertClient('333222111', 'Daniela');
            const appointmentId = await insertAppointmentInOffset({
                shopId,
                barberId,
                clientId: linkedClient.id,
                hoursFromNow: 24,
            });
            await getPool().query(
                `INSERT INTO notifications_log (
                    appointment_id, client_id, status, trigger_type, scheduled_for, sent_at
                ) VALUES ($1, $2, 'sent', 'reminder_24h', NOW(), NOW())`,
                [appointmentId, linkedClient.id]
            );

            const response = await request(app)
                .post('/api/notifications/reminders/test')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.sent).toBe(1);
            expect(mockedSendTelegram).toHaveBeenCalledWith(
                '333222111',
                expect.stringContaining('[MENSAJE DE PRUEBA]')
            );

            const logCheck = await getPool().query('SELECT * FROM notifications_log WHERE appointment_id = $1', [
                appointmentId,
            ]);
            expect(logCheck.rows).toHaveLength(1);
        });

        test('RECEPTIONIST puede disparar recordatorios de prueba (200)', async () => {
            const response = await request(app)
                .post('/api/notifications/reminders/test')
                .set('Authorization', `Bearer ${receptionistToken}`);

            expect(response.status).toBe(200);
        });

        test('CLIENT recibe 403 Forbidden al intentar disparar envíos de prueba', async () => {
            const client = await insertClient(null);
            const clientToken = mintToken(client.id, 'client', client.email);

            const response = await request(app)
                .post('/api/notifications/reminders/test')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('Only staff can trigger test reminders');
        });

        test('Debe responder 401 Unauthorized si no se envía token', async () => {
            const response = await request(app).post('/api/notifications/reminders/test');
            expect(response.status).toBe(401);
        });
    });

    describe('processReminders() - Flujo completo CU-43', () => {
        test('Debe enviar recordatorios de 24h y 4h, registrar sent/failed y evitar duplicados', async () => {
            const clientWithTelegram24h = await insertClient('444555666', 'Diego');
            const clientWithTelegram4h = await insertClient('777888999', 'Valeria');
            const clientWithoutTelegram = await insertClient(null, 'SinTelegram');
            const appt24h = await insertAppointmentInOffset({
                shopId,
                barberId,
                clientId: clientWithTelegram24h.id,
                hoursFromNow: 24,
            });

            const appt4h = await insertAppointmentInOffset({
                shopId,
                barberId,
                clientId: clientWithTelegram4h.id,
                hoursFromNow: 4,
            });

            const apptNoContact = await insertAppointmentInOffset({
                shopId,
                barberId,
                clientId: clientWithoutTelegram.id,
                hoursFromNow: 24,
            });

            const apptOutOfWindow = await insertAppointmentInOffset({
                shopId,
                barberId,
                clientId: clientWithTelegram24h.id,
                hoursFromNow: 48,
            });

            await processReminders();

            const pool = getPool();

            const log24h = await pool.query('SELECT * FROM notifications_log WHERE appointment_id = $1', [appt24h]);
            expect(log24h.rows.length).toBe(1);
            expect(log24h.rows[0].status).toBe('sent');
            expect(log24h.rows[0].trigger_type).toBe('reminder_24h');
            expect(log24h.rows[0].provider_message_id).toBe('msg_telegram_12345');
            expect(log24h.rows[0].sent_at).not.toBeNull();

            const log4h = await pool.query('SELECT * FROM notifications_log WHERE appointment_id = $1', [appt4h]);
            expect(log4h.rows.length).toBe(1);
            expect(log4h.rows[0].status).toBe('sent');
            expect(log4h.rows[0].trigger_type).toBe('reminder_4h');

            const logFailed = await pool.query('SELECT * FROM notifications_log WHERE appointment_id = $1', [
                apptNoContact,
            ]);
            expect(logFailed.rows.length).toBe(1);
            expect(logFailed.rows[0].status).toBe('failed');
            expect(logFailed.rows[0].failure_reason).toContain('client_telegram_id');

            const logOut = await pool.query('SELECT * FROM notifications_log WHERE appointment_id = $1', [
                apptOutOfWindow,
            ]);
            expect(logOut.rows.length).toBe(0);

            mockedSendTelegram.mockClear();
            await processReminders();

            expect(mockedSendTelegram).not.toHaveBeenCalledWith('444555666', expect.any(String));
            expect(mockedSendTelegram).not.toHaveBeenCalledWith('777888999', expect.any(String));
        });
    });
});