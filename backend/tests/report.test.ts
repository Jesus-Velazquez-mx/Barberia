import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { businessWallClockToUtcMs } from '../src/utils/businessTime.js';
import { calculateCompletionPercentage } from '../src/utils/reportMapper.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';
import {
    insertManager,
    insertShop,
    insertUser,
    insertReceptionist,
    insertBarber,
    insertService,
    insertAppointment,
    cleanupFixtures,
    getSeededShiftId,
} from './helpers/availabilityFixtures.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

const FORBIDDEN_SHOP = 'No cuenta con permisos para generar reportes de esta sucursal.';
const INVALID_RANGE = 'El rango de fechas proporcionado no es válido.';
const NO_DATA = 'No hay datos suficientes para generar el reporte en el rango de fechas indicado.';
const BARBER_NOT_FOUND = 'No se encontraron barberos con los datos proporcionados en esta sucursal.';

describe('calculateCompletionPercentage', () => {
    test.each([
        [0, 0, null],
        [0, 4, 0],
        [4, 4, 100],
        [1, 3, 33.3],
        [2, 3, 66.7],
    ])('%i de %i -> %p', (completed, scheduled, expected) => {
        expect(calculateCompletionPercentage(completed, scheduled)).toBe(expected);
    });
});

describe('GET /api/reports/barber-performance', () => {
    type Status = 'scheduled' | 'rescheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

    let managerToken: string;
    let otherManagerToken: string;
    let receptionistToken: string;
    let clientToken: string;
    let deactivatedManagerToken: string;
    let shopA: string;
    let shopB: string;
    let foreignShop: string;
    let emptyShop: string;
    let jose: { id: string; email: string };
    let mariana: { id: string; email: string };
    let idle: { id: string; email: string };
    let deletedWithWork: { id: string; email: string };
    let deletedIdle: { id: string; email: string };
    let moved: { id: string; email: string };
    let serviceIds: string[];

    // Rango evaluado en la mayoría de las pruebas
    const RANGE = { startDate: '2025-03-01', endDate: '2025-03-31' };

    // Instante real de una hora de pared del negocio
    const at = (date: string, time: string) => new Date(businessWallClockToUtcMs(Date.parse(`${date}T${time}Z`)));

    const book = async (
        shopId: string,
        barberId: string,
        date: string,
        status: Status,
        serviceCount = 1,
        time = '10:00:00'
    ) => {
        const start = at(date, time);
        const id = await insertAppointment(shopId, barberId, start, new Date(start.getTime() + 30 * 60_000), {
            status,
        });
        for (const serviceId of serviceIds.slice(0, serviceCount)) {
            await getPool().query(
                `INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking)
                 VALUES ($1, $2, 100, 30)`,
                [id, serviceId]
            );
        }
        return id;
    };

    const get = (token: string | null, query: Record<string, string> = {}) => {
        const req = request(app).get('/api/reports/barber-performance').query(query);
        return token ? req.set('Authorization', `Bearer ${token}`) : req;
    };

    const barberIdsOf = (res: request.Response): string[] =>
        res.body.data.barbers.map((b: { barberId: string }) => b.barberId).sort();

    const findBarber = (res: request.Response, id: string) =>
        res.body.data.barbers.find((b: { barberId: string }) => b.barberId === id);

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        managerToken = mintToken(manager.id, 'manager', manager.email);
        shopA = await insertShop(manager.id);
        shopB = await insertShop(manager.id);
        emptyShop = await insertShop(manager.id);

        const otherManager = await insertManager();
        otherManagerToken = mintToken(otherManager.id, 'manager', otherManager.email);
        foreignShop = await insertShop(otherManager.id);

        const deactivated = await insertManager();
        await getPool().query('UPDATE managers SET deleted_at = now() WHERE user_id = $1', [deactivated.id]);
        deactivatedManagerToken = mintToken(deactivated.id, 'manager', deactivated.email);

        const receptionist = await insertReceptionist(shopA, await getSeededShiftId());
        receptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);
        const client = await insertUser('client');
        clientToken = mintToken(client.id, 'client', client.email);

        serviceIds = [await insertService(), await insertService(), await insertService()];

        jose = await insertBarber(shopA, { firstName: 'José Carlos', lastName: 'Pérez López' });
        mariana = await insertBarber(shopA, { firstName: 'Mariana', lastName: 'Núñez' });
        idle = await insertBarber(shopA, { firstName: 'Iván', lastName: 'Sin Citas' });
        deletedWithWork = await insertBarber(shopA, { firstName: 'Beto', lastName: 'Baja', isDeleted: true });
        deletedIdle = await insertBarber(shopA, { firstName: 'Raúl', lastName: 'Ausente', isDeleted: true });
        // Hoy pertenece a B, pero trabajó en A dentro del rango
        moved = await insertBarber(shopB, { firstName: 'Tomás', lastName: 'Reasignado' });

        // José: 8 servicios agendados en 6 citas, 5 finalizados en 2 citas
        await book(shopA, jose.id, '2025-03-01', 'completed', 3, '00:00:00'); // primer instante del rango
        await book(shopA, jose.id, '2025-03-31', 'completed', 2, '23:59:00'); // último minuto del rango
        await book(shopA, jose.id, '2025-03-10', 'cancelled', 1);
        await book(shopA, jose.id, '2025-03-11', 'no_show', 1);
        await book(shopA, jose.id, '2025-03-12', 'rescheduled', 1);
        await book(shopA, jose.id, '2025-03-13', 'checked_in', 0);
        // Fuera del rango, a un minuto de cada extremo
        await book(shopA, jose.id, '2025-02-28', 'completed', 3, '23:59:00');
        await book(shopA, jose.id, '2025-04-01', 'completed', 3, '00:00:00');

        // Mariana: 2 agendados, 0 finalizados
        await book(shopA, mariana.id, '2025-03-05', 'scheduled', 2);

        await book(shopA, deletedWithWork.id, '2025-03-06', 'completed', 1);
        await book(shopA, moved.id, '2025-03-07', 'completed', 1);
        await book(shopB, moved.id, '2025-03-20', 'completed', 2);
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    describe('autenticación y permisos', () => {
        test('401 sin token o con token inválido', async () => {
            expect((await get(null, { shopId: shopA, ...RANGE })).status).toBe(401);
            expect((await get('no-es-un-jwt', { shopId: shopA, ...RANGE })).status).toBe(401);
        });

        test('403 para recepcionistas y clientes', async () => {
            expect((await get(receptionistToken, { shopId: shopA, ...RANGE })).status).toBe(403);
            expect((await get(clientToken, { shopId: shopA, ...RANGE })).status).toBe(403);
        });

        test('403 para un gerente dado de baja', async () => {
            expect((await get(deactivatedManagerToken, { shopId: shopA, ...RANGE })).status).toBe(403);
        });

        test('403 con el mensaje del caso de uso para una sucursal de otro gerente', async () => {
            const own = await get(managerToken, { shopId: foreignShop, ...RANGE });
            expect(own.status).toBe(403);
            expect(own.body.message).toBe(FORBIDDEN_SHOP);

            const other = await get(otherManagerToken, { shopId: shopA, ...RANGE });
            expect(other.status).toBe(403);
            expect(other.body.message).toBe(FORBIDDEN_SHOP);
        });

        test('una sucursal inexistente responde igual que una ajena', async () => {
            const res = await get(managerToken, { shopId: '00000000-0000-4000-8000-000000000000', ...RANGE });
            expect(res.status).toBe(403);
            expect(res.body.message).toBe(FORBIDDEN_SHOP);
        });

        test('la sucursal no autorizada se rechaza antes de validar las fechas', async () => {
            const res = await get(managerToken, { shopId: foreignShop, startDate: 'x', endDate: 'y' });
            expect(res.status).toBe(403);
        });
    });

    describe('validación de la información', () => {
        test('400 sin sucursal o con un id inválido', async () => {
            expect((await get(managerToken, RANGE)).status).toBe(400);
            expect((await get(managerToken, { shopId: 'abc', ...RANGE })).status).toBe(400);
        });

        test.each([
            ['inicio posterior al fin', { startDate: '2025-03-31', endDate: '2025-03-01' }],
            ['sin fechas', {}],
            ['sin inicio', { endDate: '2025-03-31' }],
            ['sin fin', { startDate: '2025-03-01' }],
            ['fecha vacía', { startDate: '', endDate: '2025-03-31' }],
            ['formato incorrecto', { startDate: '01/03/2025', endDate: '31/03/2025' }],
            ['día inexistente', { startDate: '2025-02-30', endDate: '2025-03-31' }],
        ])('400 con el mensaje del caso de uso: %s', async (_name, dates) => {
            const res = await get(managerToken, { shopId: shopA, ...(dates as Record<string, string>) });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(INVALID_RANGE);
        });

        test('acepta un rango de un solo día y fechas extremas', async () => {
            const oneDay = await get(managerToken, { shopId: shopA, startDate: '2025-03-06', endDate: '2025-03-06' });
            expect(oneDay.status).toBe(200);
            expect(oneDay.body.data.totals.completedServices).toBe(1);

            const wide = await get(managerToken, { shopId: shopA, startDate: '0100-01-01', endDate: '9999-12-31' });
            expect(wide.status).toBe(200);
        });
    });

    describe('datos insuficientes', () => {
        test('sin citas en el rango', async () => {
            const res = await get(managerToken, { shopId: shopA, startDate: '2020-01-01', endDate: '2020-01-31' });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe(NO_DATA);
        });

        test('con citas pero ninguna finalizada', async () => {
            const res = await get(managerToken, { shopId: shopA, ...RANGE, firstName: 'Mariana' });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe(NO_DATA);
        });

        test('sucursal sin barberos', async () => {
            const res = await get(managerToken, { shopId: emptyShop, ...RANGE });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe(NO_DATA);
        });

        test('un barbero dado de baja sin citas existe, pero no tiene datos', async () => {
            const res = await get(managerToken, { shopId: shopA, ...RANGE, firstName: 'Raúl' });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe(NO_DATA);
        });

        test('nombre que no corresponde a ningún barbero', async () => {
            const res = await get(managerToken, { shopId: shopA, ...RANGE, firstName: 'Nadie' });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe(BARBER_NOT_FOUND);
        });
    });

    describe('cálculo del reporte', () => {
        test('identificación e indicadores de un barbero, con los extremos del rango incluidos', async () => {
            const res = await get(managerToken, { shopId: shopA, ...RANGE, firstName: 'José', lastName: 'Pérez' });

            expect(res.status).toBe(200);
            expect(barberIdsOf(res)).toEqual([jose.id]);
            expect(res.body.data.barbers[0]).toEqual({
                barberId: jose.id,
                firstName: 'José Carlos',
                lastName: 'Pérez López',
                email: jose.email,
                assignedShopId: shopA,
                assignedShopName: expect.any(String),
                isActive: true,
                scheduledAppointments: 6,
                completedAppointments: 2,
                scheduledServices: 8,
                completedServices: 5,
                cancelledServices: 1,
                noShowServices: 1,
                pendingServices: 1,
                completionPercentage: 62.5,
            });
            expect(res.body.data).toMatchObject({ shopId: shopA, ...RANGE });
        });

        test('sin nombre evalúa a todos: activos, bajas con citas y reasignados con citas en la sucursal', async () => {
            const res = await get(managerToken, { shopId: shopA, ...RANGE });

            expect(res.status).toBe(200);
            expect(barberIdsOf(res)).toEqual([jose.id, mariana.id, idle.id, deletedWithWork.id, moved.id].sort());
            expect(barberIdsOf(res)).not.toContain(deletedIdle.id);

            expect(findBarber(res, mariana.id)).toMatchObject({ completedServices: 0, completionPercentage: 0 });
            expect(findBarber(res, idle.id)).toMatchObject({ scheduledServices: 0, completionPercentage: null });
            expect(findBarber(res, deletedWithWork.id)).toMatchObject({ isActive: false, completedServices: 1 });
        });

        test('los totales suman a los evaluados y el porcentaje se calcula sobre la suma', async () => {
            const res = await get(managerToken, { shopId: shopA, ...RANGE });
            // José 8/5, Mariana 2/0, Beto 1/1, Tomás 1/1
            expect(res.body.data.totals).toEqual({
                scheduledAppointments: 9,
                completedAppointments: 4,
                scheduledServices: 12,
                completedServices: 7,
                cancelledServices: 1,
                noShowServices: 1,
                pendingServices: 3,
                completionPercentage: 58.3,
            });
        });

        test('un barbero reasignado cuenta en cada sucursal solo lo que trabajó en ella', async () => {
            const inA = await get(managerToken, { shopId: shopA, ...RANGE, firstName: 'Tomás' });
            expect(inA.body.data.barbers[0]).toMatchObject({ completedServices: 1, assignedShopId: shopB });

            const inB = await get(managerToken, { shopId: shopB, ...RANGE });
            expect(barberIdsOf(inB)).toEqual([moved.id]);
            expect(inB.body.data.barbers[0]).toMatchObject({ completedServices: 2, assignedShopId: shopB });
        });

        test.each([
            ['sin acentos ni mayúsculas', { firstName: 'jose' }],
            ['segundo nombre', { firstName: 'CARLOS' }],
            ['inicio de palabra', { lastName: 'lop' }],
            ['espacios de más', { firstName: '  josé   carlos ', lastName: ' pérez  lópez ' }],
        ])('búsqueda por nombre: %s', async (_name, query) => {
            const res = await get(managerToken, { shopId: shopA, ...RANGE, ...(query as Record<string, string>) });
            expect(barberIdsOf(res)).toEqual([jose.id]);
        });

        test('nombre y apellido deben coincidir a la vez, y no se busca a mitad de palabra', async () => {
            const mismatch = await get(managerToken, { shopId: shopA, ...RANGE, firstName: 'José', lastName: 'Núñez' });
            expect(mismatch.body.message).toBe(BARBER_NOT_FOUND);

            const middle = await get(managerToken, { shopId: shopA, ...RANGE, firstName: 'ana' });
            expect(middle.body.message).toBe(BARBER_NOT_FOUND);
        });
    });
});
