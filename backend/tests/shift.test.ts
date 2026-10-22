import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import {
    insertManager,
    insertUser,
    insertShop,
    insertBarber,
    cleanupFixtures,
    generateUniqueFixtureName,
} from './helpers/availabilityFixtures.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

// Horarios con minutos poco comunes para no chocar con turnos reales ni con los de otros archivos de prueba
// (start_time + end_time es UNIQUE en toda la tabla).
const TIMES = {
    base: { start_time: '05:07', end_time: '13:07' }, // 8h
    overlapping: { start_time: '05:07', end_time: '09:07' }, // 4h, mismo inicio que base
    sixHours: { start_time: '06:11', end_time: '12:11' }, // 6h
    other: { start_time: '07:19', end_time: '15:19' }, // 8h
};

describe('Pruebas de endpoints de Turnos (Shifts)', () => {
    let managerToken: string;
    let receptionistToken: string;
    let clientToken: string;
    let receptionistId: string;

    // Turnos creados en las pruebas (por API o por SQL) para borrarlos al final
    const createdShiftIds: string[] = [];
    const receptionistRowIds: string[] = [];

    const insertShiftRow = async (name: string, startTime: string, endTime: string): Promise<string> => {
        const res = await getPool().query(
            `INSERT INTO shifts (name, start_time, end_time) VALUES ($1, $2, $3) RETURNING id`,
            [name, startTime, endTime]
        );
        createdShiftIds.push(res.rows[0].id);
        return res.rows[0].id;
    };

    const postShift = (token: string | null, body: object) => {
        const req = request(app).post('/api/shifts');
        return (token ? req.set('Authorization', `Bearer ${token}`) : req).send(body);
    };

    const createViaApi = async (name: string, times: { start_time: string; end_time: string }) => {
        const res = await postShift(managerToken, { name, ...times });
        if (res.status === 201) createdShiftIds.push(res.body.data.id);
        return res;
    };

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        const receptionist = await insertUser('receptionist');
        const client = await insertUser('client');
        receptionistId = receptionist.id;

        managerToken = mintToken(manager.id, 'manager', manager.email);
        receptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);
        clientToken = mintToken(client.id, 'client', client.email);
    });

    afterAll(async () => {
        const pool = getPool();
        // Los recepcionistas con turno asignado bloquean el borrado de sucursales y turnos
        if (receptionistRowIds.length > 0) {
            await pool.query('DELETE FROM receptionists WHERE user_id = ANY($1::uuid[])', [receptionistRowIds]);
        }
        await cleanupFixtures();
        if (createdShiftIds.length > 0) {
            await pool.query('DELETE FROM shifts WHERE id = ANY($1::uuid[])', [createdShiftIds]);
        }
        await closeDB();
    });

    describe('Autorización por rol', () => {
        let shiftId: string;

        beforeAll(async () => {
            shiftId = await insertShiftRow(generateUniqueFixtureName('Auth'), '04:41', '08:41');
        });

        test('Sin token responde 401', async () => {
            expect((await request(app).get('/api/shifts')).status).toBe(401);
            expect((await postShift(null, { name: 'x', ...TIMES.other })).status).toBe(401);
        });

        test('Recepcionista puede listar y consultar por ID', async () => {
            const list = await request(app).get('/api/shifts').set('Authorization', `Bearer ${receptionistToken}`);
            expect(list.status).toBe(200);
            expect(list.body.data.some((s: { id: string }) => s.id === shiftId)).toBe(true);

            const one = await request(app)
                .get(`/api/shifts/${shiftId}`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(one.status).toBe(200);
            expect(one.body.data.id).toBe(shiftId);
        });

        test('Recepcionista no puede crear, editar ni eliminar (403)', async () => {
            const post = await postShift(receptionistToken, { name: generateUniqueFixtureName('R'), ...TIMES.other });
            expect(post.status).toBe(403);

            const put = await request(app)
                .put(`/api/shifts/${shiftId}`)
                .set('Authorization', `Bearer ${receptionistToken}`)
                .send({ name: generateUniqueFixtureName('R') });
            expect(put.status).toBe(403);

            const del = await request(app)
                .delete(`/api/shifts/${shiftId}`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(del.status).toBe(403);

            const still = await getPool().query('SELECT 1 FROM shifts WHERE id = $1', [shiftId]);
            expect(still.rows).toHaveLength(1);
        });

        test('Cliente recibe 403 en todos los endpoints', async () => {
            const auth = { Authorization: `Bearer ${clientToken}` };
            expect((await request(app).get('/api/shifts').set(auth)).status).toBe(403);
            expect((await request(app).get(`/api/shifts/${shiftId}`).set(auth)).status).toBe(403);
            expect((await postShift(clientToken, { name: 'x', ...TIMES.other })).status).toBe(403);
            expect((await request(app).put(`/api/shifts/${shiftId}`).set(auth).send({ name: 'x' })).status).toBe(403);
            expect((await request(app).delete(`/api/shifts/${shiftId}`).set(auth)).status).toBe(403);
        });
    });

    describe('Listar y consultar (GET /api/shifts)', () => {
        test('Manager obtiene la lista ordenada por hora de inicio', async () => {
            const res = await request(app).get('/api/shifts').set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(200);

            const starts: string[] = res.body.data.map((s: { start_time: string }) => s.start_time);
            expect(starts).toEqual([...starts].sort());
        });

        test('ID inexistente responde 404 y mal formado responde 400', async () => {
            const auth = { Authorization: `Bearer ${managerToken}` };
            const missing = await request(app).get('/api/shifts/00000000-0000-4000-8000-000000000000').set(auth);
            expect(missing.status).toBe(404);

            const malformed = await request(app).get('/api/shifts/not-a-uuid').set(auth);
            expect(malformed.status).toBe(400);
        });
    });

    describe('Crear (POST /api/shifts)', () => {
        let baseName: string;

        beforeAll(async () => {
            baseName = generateUniqueFixtureName('Base');
            const res = await createViaApi(baseName, TIMES.base);
            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe(baseName);
        });

        test('Nombre repetido (sin distinguir mayúsculas) responde 409', async () => {
            const res = await postShift(managerToken, { name: baseName.toUpperCase(), ...TIMES.other });
            expect(res.status).toBe(409);
        });

        test('Mismo horario exacto que otro turno responde 409', async () => {
            const res = await postShift(managerToken, { name: generateUniqueFixtureName('Dup'), ...TIMES.base });
            expect(res.status).toBe(409);
        });

        test('Horario traslapado pero distinto se permite', async () => {
            const res = await createViaApi(generateUniqueFixtureName('Overlap'), TIMES.overlapping);
            expect(res.status).toBe(201);
        });

        test.each([
            ['3 horas', '08:00', '11:00'],
            ['5 horas', '08:00', '13:00'],
            ['9 horas', '08:00', '17:00'],
            ['4h30', '08:00', '12:30'],
        ])('Duración inválida (%s) responde 422', async (_label, start_time, end_time) => {
            const res = await postShift(managerToken, { name: generateUniqueFixtureName('Len'), start_time, end_time });
            expect(res.status).toBe(422);
        });

        test('Fin anterior al inicio responde 422', async () => {
            const res = await postShift(managerToken, {
                name: generateUniqueFixtureName('Rev'),
                start_time: '16:00',
                end_time: '08:00',
            });
            expect(res.status).toBe(422);
        });

        test('Duración de 6 horas se acepta', async () => {
            const res = await createViaApi(generateUniqueFixtureName('Six'), TIMES.sixHours);
            expect(res.status).toBe(201);
        });

        test('Campos faltantes o con formato inválido responden 400', async () => {
            expect((await postShift(managerToken, { name: 'x' })).status).toBe(400);
            expect(
                (await postShift(managerToken, { name: 'x', start_time: '8am', end_time: '16:00' })).status
            ).toBe(400);
            expect((await postShift(managerToken, { name: ' ', ...TIMES.other })).status).toBe(400);
        });
    });

    describe('Editar (PUT /api/shifts/:id)', () => {
        let shiftId: string;
        let otherName: string;

        beforeAll(async () => {
            shiftId = await insertShiftRow(generateUniqueFixtureName('Edit'), '03:23', '09:23'); // 6h
            otherName = generateUniqueFixtureName('EditOther');
            await insertShiftRow(otherName, '03:29', '11:29'); // 8h
        });

        const put = (id: string, body: object) =>
            request(app).put(`/api/shifts/${id}`).set('Authorization', `Bearer ${managerToken}`).send(body);

        test('Actualización parcial del nombre', async () => {
            const newName = generateUniqueFixtureName('Renamed');
            const res = await put(shiftId, { name: newName });
            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe(newName);
            expect(res.body.data.start_time).toBe('03:23:00');
        });

        test('Reenviar sus propios valores no cuenta como duplicado', async () => {
            const res = await put(shiftId, { start_time: '03:23', end_time: '09:23' });
            expect(res.status).toBe(200);
        });

        test('La duración se valida contra el valor combinado', async () => {
            // fin actual 09:23; mover solo el inicio a 05:23 deja 4h (válido), a 06:23 deja 3h (inválido)
            expect((await put(shiftId, { start_time: '06:23' })).status).toBe(422);
            expect((await put(shiftId, { start_time: '05:23' })).status).toBe(200);
        });

        test('Nombre de otro turno responde 409', async () => {
            expect((await put(shiftId, { name: otherName })).status).toBe(409);
        });

        test('Horario exacto de otro turno responde 409', async () => {
            const res = await put(shiftId, { start_time: '03:29', end_time: '11:29' });
            expect(res.status).toBe(409);
        });

        test('Cuerpo vacío responde 400 y turno inexistente 404', async () => {
            expect((await put(shiftId, {})).status).toBe(400);
            expect((await put('00000000-0000-4000-8000-000000000000', { name: 'x' })).status).toBe(404);
        });
    });

    describe('Eliminar (DELETE /api/shifts/:id)', () => {
        const del = (id: string) =>
            request(app).delete(`/api/shifts/${id}`).set('Authorization', `Bearer ${managerToken}`);

        test('Elimina un turno sin personal asignado', async () => {
            const id = await insertShiftRow(generateUniqueFixtureName('Del'), '02:31', '06:31');
            const res = await del(id);
            expect(res.status).toBe(200);

            const gone = await getPool().query('SELECT 1 FROM shifts WHERE id = $1', [id]);
            expect(gone.rows).toHaveLength(0);
        });

        test('Turno inexistente responde 404', async () => {
            expect((await del('00000000-0000-4000-8000-000000000000')).status).toBe(404);
        });

        test('No elimina un turno con un barbero asignado (409)', async () => {
            const id = await insertShiftRow(generateUniqueFixtureName('WithBarber'), '02:37', '08:37');
            const manager = await insertManager();
            const shopId = await insertShop(manager.id);
            await insertBarber(shopId, { shiftId: id });

            const res = await del(id);
            expect(res.status).toBe(409);
            expect((await getPool().query('SELECT 1 FROM shifts WHERE id = $1', [id])).rows).toHaveLength(1);
        });

        test('No elimina un turno con un barbero dado de baja lógicamente (409)', async () => {
            const id = await insertShiftRow(generateUniqueFixtureName('SoftDelBarb'), '02:43', '10:43');
            const manager = await insertManager();
            const shopId = await insertShop(manager.id);
            await insertBarber(shopId, { shiftId: id, isDeleted: true });

            expect((await del(id)).status).toBe(409);
        });

        test('No elimina un turno con un recepcionista asignado (409)', async () => {
            const id = await insertShiftRow(generateUniqueFixtureName('WithRecep'), '02:47', '06:47');
            const manager = await insertManager();
            const shopId = await insertShop(manager.id);
            await getPool().query('INSERT INTO receptionists (user_id, shop_id, shift_id) VALUES ($1, $2, $3)', [
                receptionistId,
                shopId,
                id,
            ]);
            receptionistRowIds.push(receptionistId);

            expect((await del(id)).status).toBe(409);
        });
    });
});
