import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { getBusinessToday, businessWallClockToUtcMs } from '../src/utils/businessTime.js';
import {
    insertManager,
    insertUser,
    insertShop,
    insertBarber,
    insertShift,
    insertReceptionist,
    insertService,
    insertAppointment,
    cleanupFixtures,
    createdAppointmentIds,
} from './helpers/availabilityFixtures.js';
import { generateUniqueName } from './helpers/uniqueValues.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

// Los tokens se firman al hacer cada request (con el reloj congelado): firmados antes, la verificación con la
// hora congelada, días después, los daría por expirados.
type Identity = { id: string; role: UserRole; email: string };
const mintToken = ({ id, role, email }: Identity): string => signToken({ id, role, email } as User);

const DAY_MS = 86_400_000;
/** Suma `days` a una fecha 'YYYY-MM-DD' (calendario, sin zona horaria). */
const addDays = (date: string, days: number) =>
    new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
/** Primer día a partir de `date` (inclusive) cuyo día de la semana sea `dayOfWeek` (0 = domingo). */
const nextDayOfWeek = (date: string, dayOfWeek: number) => {
    let d = date;
    while (new Date(`${d}T00:00:00Z`).getUTCDay() !== dayOfWeek) d = addDays(d, 1);
    return d;
};

// "Hoy" del endpoint depende del reloj: se congela Date.now en un miércoles futuro para que los slots sean
// deterministas sin importar el día y la hora en que corran las pruebas. Al ser futuro, el POST de la cita
// tampoco choca con datos reales.
const WEDNESDAY = nextDayOfWeek(addDays(getBusinessToday(), 1), 3);

// Hora de pared del negocio (dígitos literales) -> instante UTC real, igual que hace el servicio.
const at = (hhmm: string, date = WEDNESDAY) =>
    new Date(businessWallClockToUtcMs(Date.parse(`${date}T${hhmm}:00.000Z`)));
const freezeAt = (hhmm: string, date = WEDNESDAY) => jest.spyOn(Date, 'now').mockReturnValue(at(hhmm, date).getTime());

describe('GET /api/shops/:id/availability/next', () => {
    let manager: Identity;
    let otherManager: Identity;
    let receptionist: Identity;
    let otherShopReceptionist: Identity;
    let client: Identity;

    let shopId: string;
    let serviceId: string;

    /** Libre todo el día: su próximo slot es el primero tras "ahora". */
    let freeBarberId: string;
    /** Ocupado de 10:00 a 11:00. */
    let busyBarberId: string;
    /** Ocupado todo el turno: no tiene slot hoy. */
    let fullBarberId: string;
    /** No acepta reservas. */
    let notAcceptingBarberId: string;

    beforeAll(async () => {
        await connectDB();

        // Managers y sucursales: shopId y otherShopId son del mismo manager; otherManager no administra ninguna.
        manager = { ...(await insertManager()), role: 'manager' };
        otherManager = { ...(await insertManager()), role: 'manager' };

        shopId = await insertShop(manager.id, { name: generateUniqueName('NextShop') });
        const otherShopId = await insertShop(manager.id, { name: generateUniqueName('OtherNextShop') });

        // Turno 09:00-13:00 y servicio de 30 min
        const shiftId = await insertShift(generateUniqueName('NextShift'), '09:00', '13:00');
        serviceId = await insertService({ durationMinutes: 30, isActive: true });

        freeBarberId = (await insertBarber(shopId, { shiftId, firstName: 'Ana', lastName: 'Libre' })).id;
        busyBarberId = (await insertBarber(shopId, { shiftId, firstName: 'Beto', lastName: 'Ocupado' })).id;
        fullBarberId = (await insertBarber(shopId, { shiftId, firstName: 'Carlos', lastName: 'Lleno' })).id;
        notAcceptingBarberId = (await insertBarber(shopId, { shiftId, isAcceptingBookings: false })).id;
        await insertBarber(otherShopId, { shiftId });

        await insertAppointment(shopId, busyBarberId, at('10:00'), at('11:00'), { status: 'scheduled' });
        await insertAppointment(shopId, fullBarberId, at('09:00'), at('13:00'), { status: 'checked_in' });

        // Recepcionistas: uno de shopId y uno de otherShopId
        receptionist = { ...(await insertReceptionist(shopId, shiftId)), role: 'receptionist' };
        otherShopReceptionist = { ...(await insertReceptionist(otherShopId, shiftId)), role: 'receptionist' };

        // Cliente: usuario base + registro en tabla clients
        const clientUser = await insertUser('client');
        await getPool().query(`INSERT INTO clients (user_id) VALUES ($1)`, [clientUser.id]);
        client = { ...clientUser, role: 'client' };
    });

    beforeEach(() => {
        // 10:05 del miércoles: los inicios de 09:00 a 10:00 ya pasaron.
        freezeAt('10:05');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    const getNext = (who: Identity | undefined, targetShopId = shopId, query: object = { serviceIds: serviceId }) => {
        const req = request(app).get(`/api/shops/${targetShopId}/availability/next`);
        if (who) req.set('Authorization', `Bearer ${mintToken(who)}`);
        return req.query(query);
    };

    // ── Resultado ──
    test('devuelve el próximo slot de hoy de cada barbero disponible, ordenado por hora', async () => {
        const res = await getNext(receptionist);

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/Next available slots retrieved successfully/i);
        // El barbero lleno y el que no acepta reservas se omiten.
        expect(res.body.data).toEqual([
            { barberId: freeBarberId, barberName: 'Ana Libre', startTime: at('10:15').toISOString() },
            { barberId: busyBarberId, barberName: 'Beto Ocupado', startTime: at('11:00').toISOString() },
        ]);
        expect(res.body.data.map((s: { barberId: string }) => s.barberId)).not.toContain(fullBarberId);
        expect(res.body.data.map((s: { barberId: string }) => s.barberId)).not.toContain(notAcceptingBarberId);
    });

    test('cada startTime es el primero de los startTimes de GET /availability para hoy', async () => {
        const [nextRes, availRes] = await Promise.all([
            getNext(manager),
            request(app).get(`/api/shops/${shopId}/availability`).query({ date: WEDNESDAY, serviceIds: serviceId }),
        ]);

        expect(nextRes.status).toBe(200);
        expect(availRes.status).toBe(200);
        for (const slot of nextRes.body.data as { barberId: string; startTime: string }[]) {
            const barber = availRes.body.data.find((b: { barberId: string }) => b.barberId === slot.barberId);
            expect(barber.startTimes[0]).toBe(slot.startTime);
        }
    });

    test('día cerrado (domingo): lista vacía', async () => {
        freezeAt('10:05', nextDayOfWeek(WEDNESDAY, 0));
        const res = await getNext(receptionist);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    test('ya no quedan slots hoy (después del turno): lista vacía', async () => {
        freezeAt('12:45');
        const res = await getNext(receptionist);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    // ── Permisos ──
    test('el manager de la sucursal puede consultarlo', async () => {
        const res = await getNext(manager);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(2);
    });

    test('sin token, responde 401', async () => {
        const res = await getNext(undefined);

        expect(res.status).toBe(401);
    });

    test('un cliente, responde 403', async () => {
        const res = await getNext(client);

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Not authorized/i);
    });

    test('un recepcionista de otra sucursal, responde 403', async () => {
        const res = await getNext(otherShopReceptionist);

        expect(res.status).toBe(403);
    });

    test('un manager que no administra la sucursal, responde 403', async () => {
        const res = await getNext(otherManager);

        expect(res.status).toBe(403);
    });

    // ── Validación y recursos ──
    test('sin serviceIds, responde 400', async () => {
        const res = await getNext(receptionist, shopId, {});

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Validation error/i);
    });

    test('id de sucursal inválido, responde 400', async () => {
        const res = await getNext(receptionist, 'not-a-uuid');

        expect(res.status).toBe(400);
    });

    test('sucursal inexistente, responde 404', async () => {
        const res = await getNext(manager, '00000000-0000-0000-0000-000000000000');

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Shop not found/i);
    });

    test('servicio desconocido, responde 404', async () => {
        const res = await getNext(receptionist, shopId, { serviceIds: '00000000-0000-0000-0000-000000000000' });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Service not found/i);
    });

    // ── El slot devuelto es aceptado por la creación de citas ──
    // Va al final: agenda una cita y cambia el próximo slot del barbero.
    test('el slot devuelto es aceptado por POST /api/appointments', async () => {
        const nextRes = await getNext(receptionist);
        const [slot] = nextRes.body.data;

        const postRes = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${mintToken(receptionist)}`)
            .send({
                barberId: slot.barberId,
                serviceIds: [serviceId],
                scheduledStart: slot.startTime,
                guestClientName: 'Walk-in Fixture',
            });

        if (postRes.body.data?.id) createdAppointmentIds.push(postRes.body.data.id);
        expect(postRes.status).toBe(201);
        expect(postRes.body.data.scheduledStart).toBe(slot.startTime);
    });
});
