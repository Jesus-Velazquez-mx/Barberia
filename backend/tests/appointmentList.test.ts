import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getBusinessDayStart } from '../src/utils/businessTime.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';
import {
    insertManager,
    insertShop,
    insertUser,
    insertBarber,
    insertService,
    insertAppointment,
    cleanupFixtures,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

describe('getBusinessDayStart', () => {
    test('devuelve las 00:00 de hoy en la zona del negocio', () => {
        const noonUtc = Date.parse('2026-10-20T15:00:00Z');
        expect(getBusinessDayStart(0, noonUtc, 'America/Mazatlan').toISOString()).toBe('2026-10-20T07:00:00.000Z');
        // 03:00Z del 21 todavía es 20:00 del día 20 en Mazatlán (UTC-7)
        const lateUtc = Date.parse('2026-10-21T03:00:00Z');
        expect(getBusinessDayStart(0, lateUtc, 'America/Mazatlan').toISOString()).toBe('2026-10-20T07:00:00.000Z');
    });

    test('usa el día local aunque en UTC sea otro día', () => {
        const utcMs = Date.parse('2026-10-20T20:00:00Z'); // 21 de octubre 05:00 en Tokio
        expect(getBusinessDayStart(0, utcMs, 'Asia/Tokyo').toISOString()).toBe('2026-10-20T15:00:00.000Z');
    });

    test('respeta el cambio de horario de verano al avanzar días', () => {
        const utcMs = Date.parse('2026-10-20T20:00:00Z');
        // Tijuana pasa de UTC-7 a UTC-8 el 1 de noviembre
        expect(getBusinessDayStart(20, utcMs, 'America/Tijuana').toISOString()).toBe('2026-11-09T08:00:00.000Z');
    });
});

describe('GET /api/appointments', () => {
    let shop1: string;
    let shop2: string;
    let foreignShop: string;
    let barber1: string;
    let barber2: string;
    let foreignBarber: string;
    let managerToken: string;
    let otherManagerToken: string;
    let receptionistToken: string;
    let client1Id: string;
    let client2Id: string;
    let client1Token: string;
    let client2Token: string;
    let serviceId: string;
    const ids: Record<string, string> = {};
    const receptionistIds: string[] = [];

    // Cita de `durationMin` minutos que inicia `offsetMs` después de las 00:00 del día (hoy + days)
    const slot = (days: number, offsetMs: number, durationMin = 30) => {
        const start = new Date(getBusinessDayStart(days).getTime() + offsetMs);
        return [start, new Date(start.getTime() + durationMin * MINUTE_MS)] as const;
    };

    const get = (token: string | null, query = '') => {
        const req = request(app).get(`/api/appointments${query}`);
        return token ? req.set('Authorization', `Bearer ${token}`) : req;
    };
    const idsOf = (res: request.Response): string[] => res.body.data.map((a: { id: string }) => a.id);
    const expectIds = (res: request.Response, keys: string[]) => {
        expect(res.status).toBe(200);
        expect(idsOf(res).sort()).toEqual(keys.map((k) => ids[k]).sort());
    };

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        managerToken = mintToken(manager.id, 'manager', manager.email);
        shop1 = await insertShop(manager.id);
        shop2 = await insertShop(manager.id);

        const otherManager = await insertManager();
        otherManagerToken = mintToken(otherManager.id, 'manager', otherManager.email);
        foreignShop = await insertShop(otherManager.id);

        const receptionist = await insertUser('receptionist');
        const shiftId = (await getPool().query(`SELECT id FROM shifts LIMIT 1`)).rows[0].id;
        await getPool().query(`INSERT INTO receptionists (user_id, shop_id, shift_id) VALUES ($1, $2, $3)`, [
            receptionist.id,
            shop1,
            shiftId,
        ]);
        receptionistIds.push(receptionist.id);
        receptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);

        const client1 = await insertUser('client');
        const client2 = await insertUser('client');
        for (const c of [client1, client2]) {
            await getPool().query(`INSERT INTO clients (user_id) VALUES ($1)`, [c.id]);
        }
        client1Id = client1.id;
        client2Id = client2.id;
        client1Token = mintToken(client1.id, 'client', client1.email);
        client2Token = mintToken(client2.id, 'client', client2.email);

        barber1 = (await insertBarber(shop1)).id;
        barber2 = (await insertBarber(shop2)).id;
        foreignBarber = (await insertBarber(foreignShop)).id;
        serviceId = await insertService({ durationMinutes: 30 });

        // Ventana por defecto: [hoy 00:00, día 30 23:59:59.999]
        ids.today = await insertAppointment(shop1, barber1, ...slot(0, 0), { clientId: client1Id });
        ids.day2Guest = await insertAppointment(shop1, barber1, ...slot(2, 10 * HOUR_MS), {
            guestClientName: 'Invitado',
            isWalkIn: true,
            status: 'completed',
        });
        ids.shop2Cancelled = await insertAppointment(shop2, barber2, ...slot(3, 11 * HOUR_MS), {
            clientId: client2Id,
            status: 'cancelled',
        });
        ids.lastDay = await insertAppointment(shop1, barber1, ...slot(29, 23 * HOUR_MS + 29 * MINUTE_MS), {
            clientId: client1Id,
            status: 'checked_in',
        });
        ids.foreign = await insertAppointment(foreignShop, foreignBarber, ...slot(3, 12 * HOUR_MS), {
            clientId: client1Id,
        });
        // Fuera de la ventana por defecto
        ids.yesterday = await insertAppointment(shop1, barber1, ...slot(-1, 12 * HOUR_MS), { clientId: client1Id });
        ids.day31 = await insertAppointment(shop1, barber1, ...slot(30, 0), { clientId: client1Id });

        await getPool().query(
            `INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking)
             VALUES ($1, $2, 200, 30)`,
            [ids.today, serviceId]
        );
    });

    afterAll(async () => {
        // receptionists.shop_id es RESTRICT: se borra antes de que cleanupFixtures elimine las sucursales
        await getPool().query(`DELETE FROM receptionists WHERE user_id = ANY($1::uuid[])`, [receptionistIds]);
        // clients debe borrarse antes que users (cleanupFixtures borra las citas rastreadas)
        await getPool().query(`DELETE FROM appointments WHERE id = ANY($1::uuid[])`, [Object.values(ids)]);
        await getPool().query(`DELETE FROM clients WHERE user_id = ANY($1::uuid[])`, [[client1Id, client2Id]]);
        await cleanupFixtures();
        await closeDB();
    });

    describe('autenticación y validación', () => {
        test('401 sin token o con token inválido', async () => {
            expect((await get(null)).status).toBe(401);
            expect((await get('no-es-un-jwt')).status).toBe(401);
        });

        test.each([
            ['clientId inválido', '?clientId=abc'],
            ['shopId inválido', '?shopId=abc'],
            ['barberId inválido', '?barberId=abc'],
            ['status inválido', '?status=pending'],
            ['clientType inválido', '?clientType=guest'],
            ['from inválido', '?from=2026-10-01'],
            ['to inválido', '?to=ayer'],
        ])('400 con %s', async (_name, query) => {
            expect((await get(managerToken, query)).status).toBe(400);
        });

        test('400 si to es anterior a from', async () => {
            const res = await get(managerToken, '?from=2026-10-31T00:00:00.000Z&to=2026-10-01T00:00:00.000Z');
            expect(res.status).toBe(400);
        });

        test('400 si el rango excede 366 días', async () => {
            const res = await get(managerToken, '?from=2026-01-01T00:00:00.000Z&to=2027-06-01T00:00:00.000Z');
            expect(res.status).toBe(400);
        });
    });

    describe('ventana de fechas', () => {
        test('por defecto incluye hoy 00:00 y el día 30 a las 23:59, y excluye ayer y el día 31', async () => {
            expectIds(await get(managerToken), ['today', 'day2Guest', 'shop2Cancelled', 'lastDay']);
        });

        test('devuelve las citas ordenadas por inicio programado', async () => {
            const res = await get(managerToken);
            const starts = res.body.data.map((a: { scheduledStart: string }) => Date.parse(a.scheduledStart));
            expect(starts).toEqual([...starts].sort((x, y) => x - y));
        });

        test('from y to explícitos son inclusivos', async () => {
            const [todayStart] = slot(0, 0);
            const [day2Start] = slot(2, 10 * HOUR_MS);
            const exact = await get(managerToken, `?from=${todayStart.toISOString()}&to=${day2Start.toISOString()}`);
            expectIds(exact, ['today', 'day2Guest']);

            const justAfterToday = new Date(todayStart.getTime() + 1).toISOString();
            const narrowed = await get(managerToken, `?from=${justAfterToday}&to=${day2Start.toISOString()}`);
            expectIds(narrowed, ['day2Guest']);
        });

        test('acepta un desfase horario en from / to', async () => {
            const [from] = slot(-1, 12 * HOUR_MS);
            const [to] = slot(-1, 13 * HOUR_MS);
            const withOffset = encodeURIComponent(from.toISOString().replace('Z', '+00:00'));
            expectIds(await get(managerToken, `?from=${withOffset}&to=${to.toISOString()}`), ['yesterday']);
        });

        test('con solo from, to es from + 30 días', async () => {
            const [day31Start] = slot(30, 0);
            expectIds(await get(managerToken, `?from=${day31Start.toISOString()}`), ['day31']);
        });
    });

    describe('filtro por estado', () => {
        test('un estado', async () => {
            expectIds(await get(managerToken, '?status=cancelled'), ['shop2Cancelled']);
        });

        test('varios estados separados por comas o repetidos', async () => {
            expectIds(await get(managerToken, '?status=completed,checked_in'), ['day2Guest', 'lastDay']);
            expectIds(await get(managerToken, '?status=completed&status=checked_in'), ['day2Guest', 'lastDay']);
        });
    });

    describe('client', () => {
        test('solo ve sus propias citas, en todas las sucursales', async () => {
            expectIds(await get(client1Token), ['today', 'lastDay', 'foreign']);
            expectIds(await get(client2Token), ['shop2Cancelled']);
        });

        test('los filtros de personal se ignoran', async () => {
            const query = `?clientId=${client2Id}&shopId=${shop2}&barberId=${barber2}&clientType=visitor`;
            expectIds(await get(client1Token, query), ['today', 'lastDay', 'foreign']);
        });

        test('puede filtrar por estado', async () => {
            expectIds(await get(client1Token, '?status=checked_in'), ['lastDay']);
        });
    });

    describe('receptionist', () => {
        test('solo ve las citas de su sucursal', async () => {
            expectIds(await get(receptionistToken), ['today', 'day2Guest', 'lastDay']);
        });

        test('shopId de otra sucursal responde 403; el de la propia, 200', async () => {
            expect((await get(receptionistToken, `?shopId=${shop2}`)).status).toBe(403);
            expect((await get(receptionistToken, `?shopId=${foreignShop}`)).status).toBe(403);
            expectIds(await get(receptionistToken, `?shopId=${shop1}`), ['today', 'day2Guest', 'lastDay']);
        });

        test('un barbero de otra sucursal no devuelve citas', async () => {
            expectIds(await get(receptionistToken, `?barberId=${barber2}`), []);
        });
    });

    describe('manager', () => {
        test('ve las citas de todas las sucursales que administra y de ninguna otra', async () => {
            const res = await get(managerToken);
            expect(idsOf(res)).not.toContain(ids.foreign);
            expectIds(res, ['today', 'day2Guest', 'shop2Cancelled', 'lastDay']);
        });

        test('shopId acota a una sucursal; una ajena responde 403', async () => {
            expectIds(await get(managerToken, `?shopId=${shop2}`), ['shop2Cancelled']);
            expectIds(await get(managerToken, `?shopId=${shop1}`), ['today', 'day2Guest', 'lastDay']);
            expect((await get(managerToken, `?shopId=${foreignShop}`)).status).toBe(403);
        });

        test('otro gerente solo ve su sucursal', async () => {
            expectIds(await get(otherManagerToken), ['foreign']);
            expect((await get(otherManagerToken, `?shopId=${shop1}`)).status).toBe(403);
        });

        test('filtra por clientId', async () => {
            expectIds(await get(managerToken, `?clientId=${client1Id}`), ['today', 'lastDay']);
            expectIds(await get(managerToken, `?clientId=${client2Id}`), ['shop2Cancelled']);
        });

        test('filtra por clientType', async () => {
            expectIds(await get(managerToken, '?clientType=visitor'), ['day2Guest']);
            expectIds(await get(managerToken, '?clientType=registered'), ['today', 'shop2Cancelled', 'lastDay']);
        });

        test('filtra por barbero', async () => {
            expectIds(await get(managerToken, `?barberId=${barber2}`), ['shop2Cancelled']);
        });

        test('combina filtros', async () => {
            const res = await get(managerToken, `?shopId=${shop1}&clientType=registered&status=scheduled`);
            expectIds(res, ['today']);
        });
    });

    test('cada cita incluye sus servicios', async () => {
        const res = await get(client1Token);
        const today = res.body.data.find((a: { id: string }) => a.id === ids.today);
        const lastDay = res.body.data.find((a: { id: string }) => a.id === ids.lastDay);

        expect(today.services).toEqual([{ serviceId, priceAtBooking: 200, durationMinutesAtBooking: 30 }]);
        expect(lastDay.services).toEqual([]);
        expect(today).toMatchObject({
            shopId: shop1,
            barberId: barber1,
            clientId: client1Id,
            isRegisteredClient: true,
            status: 'scheduled',
        });
    });
});
