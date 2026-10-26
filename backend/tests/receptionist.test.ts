import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import {
    insertManager,
    insertUser,
    insertShop,
    insertReceptionist,
    cleanupFixtures,
    createdReceptionistIds,
    createdUserIds,
    generateUniqueFixtureEmail,
    generateUniqueFixturePhone,
} from './helpers/availabilityFixtures.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

describe('Pruebas de endpoints de Recepcionistas (Receptionists)', () => {
    let manager: { id: string; email: string };
    let otherManager: { id: string; email: string };
    let clientUser: { id: string; email: string };
    let managerToken: string;
    let otherManagerToken: string;
    let clientToken: string;

    let shopId: string;
    let otherShopId: string;
    let emptyShopId: string;
    let reassignShopId: string;
    let shiftId: string;
    let otherShiftId: string;

    // Registra en los fixtures a un recepcionista creado por la API para que se limpie al final
    const track = (userId: string) => {
        createdReceptionistIds.push(userId);
        createdUserIds.push(userId);
    };

    const buildBody = (overrides: Record<string, unknown> = {}) => ({
        firstName: 'Misato',
        lastName: 'Katsuragi',
        email: generateUniqueFixtureEmail('recep'),
        phone: generateUniqueFixturePhone(),
        birthDate: '1990-05-20',
        gender: 'female',
        password: 'secret123',
        shopId,
        shiftId,
        ...overrides,
    });

    const createViaApi = async (overrides: Record<string, unknown> = {}) => {
        const body = buildBody(overrides);
        const res = await request(app)
            .post('/api/receptionists')
            .set('Authorization', `Bearer ${managerToken}`)
            .send(body);
        if (res.status === 201) track(res.body.data.userId);
        return { res, body };
    };

    beforeAll(async () => {
        await connectDB();
        const pool = getPool();

        manager = await insertManager();
        otherManager = await insertManager();
        clientUser = await insertUser('client');

        managerToken = mintToken(manager.id, 'manager', manager.email);
        otherManagerToken = mintToken(otherManager.id, 'manager', otherManager.email);
        clientToken = mintToken(clientUser.id, 'client', clientUser.email);

        const shifts = await pool.query(`SELECT id FROM shifts ORDER BY name LIMIT 2`);
        shiftId = shifts.rows[0].id;
        otherShiftId = shifts.rows[1]?.id ?? shiftId;

        shopId = await insertShop(manager.id);
        emptyShopId = await insertShop(manager.id);
        reassignShopId = await insertShop(manager.id);
        otherShopId = await insertShop(otherManager.id);
    });

    afterAll(async () => {
        await cleanupFixtures();
        await closeDB();
    });

    describe('Registrar Recepcionista (POST /api/receptionists)', () => {
        test('Debe responder 201, crear users + receptionists y no exponer el hash', async () => {
            const { res, body } = await createViaApi();

            expect(res.status).toBe(201);
            expect(res.body.data.userId).toBeDefined();
            expect(res.body.data.email).toBe(body.email);
            expect(res.body.data.shopId).toBe(shopId);
            expect(res.body.data.shiftId).toBe(shiftId);
            expect(res.body.data.deletedAt).toBeNull();
            expect(res.body.data.password).toBeUndefined();
            expect(res.body.data.password_hash).toBeUndefined();

            const row = await getPool().query(
                `SELECT u.role, r.shop_id FROM users u JOIN receptionists r ON r.user_id = u.id WHERE u.id = $1`,
                [res.body.data.userId]
            );
            expect(row.rows[0].role).toBe('receptionist');
            expect(row.rows[0].shop_id).toBe(shopId);
        });

        test('El recepcionista creado puede iniciar sesión con la contraseña indicada', async () => {
            const { res, body } = await createViaApi();
            expect(res.status).toBe(201);

            const login = await request(app)
                .post('/api/auth/login')
                .send({ email: body.email, password: body.password });
            expect(login.status).toBe(200);
        });

        test('Debe responder 401 sin token', async () => {
            const res = await request(app).post('/api/receptionists').send(buildBody());
            expect(res.status).toBe(401);
        });

        test('Debe responder 403 si un cliente intenta registrar un recepcionista', async () => {
            const res = await request(app)
                .post('/api/receptionists')
                .set('Authorization', `Bearer ${clientToken}`)
                .send(buildBody());
            expect(res.status).toBe(403);
        });

        test('Debe responder 403 si el manager no administra la sucursal indicada', async () => {
            const res = await request(app)
                .post('/api/receptionists')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(buildBody({ shopId: otherShopId }));
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/not authorized/i);
        });

        test('Debe responder 403 si la cuenta del manager está dada de baja', async () => {
            const deactivated = await insertManager();
            await getPool().query('UPDATE managers SET deleted_at = NOW() WHERE user_id = $1', [deactivated.id]);
            const res = await request(app)
                .post('/api/receptionists')
                .set('Authorization', `Bearer ${mintToken(deactivated.id, 'manager', deactivated.email)}`)
                .send(buildBody());
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/deactivated/i);
        });

        test('Debe responder 404 si la sucursal no existe', async () => {
            const res = await request(app)
                .post('/api/receptionists')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(buildBody({ shopId: UNKNOWN_UUID }));
            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/shop not found/i);
        });

        test('Debe responder 404 si el turno no existe', async () => {
            const res = await request(app)
                .post('/api/receptionists')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(buildBody({ shiftId: UNKNOWN_UUID }));
            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/shift not found/i);
        });

        test('Debe responder 409 si el correo pertenece a un recepcionista activo', async () => {
            const first = await createViaApi();
            expect(first.res.status).toBe(201);

            const { res } = await createViaApi({ email: first.body.email });
            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/active receptionist/i);
        });

        test('Debe responder 409 si el correo pertenece a un cliente o a un manager', async () => {
            const asClient = await createViaApi({ email: clientUser.email });
            expect(asClient.res.status).toBe(409);

            const asManager = await createViaApi({ email: otherManager.email });
            expect(asManager.res.status).toBe(409);
        });

        test('Debe responder 409 si el teléfono ya está en uso', async () => {
            const first = await createViaApi();
            expect(first.res.status).toBe(201);

            const { res } = await createViaApi({ phone: first.body.phone });
            expect(res.status).toBe(409);
        });

        test('Debe responder 400 ante datos inválidos', async () => {
            const badEmail = await createViaApi({ email: 'no-es-correo' });
            expect(badEmail.res.status).toBe(400);

            const shortPassword = await createViaApi({ password: '123' });
            expect(shortPassword.res.status).toBe(400);

            const badDate = await createViaApi({ birthDate: 'no-es-fecha' });
            expect(badDate.res.status).toBe(400);

            const badShop = await createViaApi({ shopId: 'no-es-uuid' });
            expect(badShop.res.status).toBe(400);
        });

        test('Debe reactivar a un recepcionista dado de baja con los nuevos datos (mismo ID)', async () => {
            const first = await createViaApi();
            expect(first.res.status).toBe(201);
            const userId = first.res.body.data.userId;

            const del = await request(app)
                .delete(`/api/receptionists/${userId}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(del.status).toBe(200);

            const { res, body } = await createViaApi({
                email: first.body.email,
                firstName: 'Ritsuko',
                shopId: reassignShopId,
                shiftId: otherShiftId,
                password: 'newsecret456',
            });

            expect(res.status).toBe(201);
            expect(res.body.data.userId).toBe(userId);
            expect(res.body.data.firstName).toBe('Ritsuko');
            expect(res.body.data.shopId).toBe(reassignShopId);
            expect(res.body.data.shiftId).toBe(otherShiftId);
            expect(res.body.data.deletedAt).toBeNull();

            const login = await request(app)
                .post('/api/auth/login')
                .send({ email: body.email, password: 'newsecret456' });
            expect(login.status).toBe(200);
        });

        test('La reactivación responde 403 si la nueva sucursal no es del manager', async () => {
            const gone = await insertReceptionist(shopId, shiftId, { isDeleted: true });

            const res = await request(app)
                .post('/api/receptionists')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(buildBody({ email: gone.email, shopId: otherShopId }));
            expect(res.status).toBe(403);
        });

        test('La reactivación responde 409 si el teléfono pertenece a otro usuario', async () => {
            const taken = await createViaApi();
            const gone = await insertReceptionist(shopId, shiftId, { isDeleted: true });

            const res = await request(app)
                .post('/api/receptionists')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(buildBody({ email: gone.email, phone: taken.body.phone }));
            expect(res.status).toBe(409);
        });
    });

    describe('Obtener Recepcionista (GET /api/receptionists/:id)', () => {
        test('Debe responder 200 con el perfil completo para el manager de la sucursal', async () => {
            const rec = await insertReceptionist(shopId, shiftId);
            const res = await request(app)
                .get(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.userId).toBe(rec.id);
            expect(res.body.data.email).toBe(rec.email);
            expect(res.body.data.password_hash).toBeUndefined();
        });

        test('Debe devolver también a un recepcionista dado de baja', async () => {
            const rec = await insertReceptionist(shopId, shiftId, { isDeleted: true });
            const res = await request(app)
                .get(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.deletedAt).not.toBeNull();
        });

        test('Debe responder 403 si el recepcionista es de una sucursal de otro manager', async () => {
            const rec = await insertReceptionist(otherShopId, shiftId);
            const res = await request(app)
                .get(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(403);
        });

        test('Debe responder 403 para un cliente y para un recepcionista', async () => {
            const rec = await insertReceptionist(shopId, shiftId);

            const asClient = await request(app)
                .get(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${clientToken}`);
            expect(asClient.status).toBe(403);

            const asReceptionist = await request(app)
                .get(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${mintToken(rec.id, 'receptionist', rec.email)}`);
            expect(asReceptionist.status).toBe(403);
        });

        test('Debe responder 401 sin token, 400 con ID inválido y 404 si no existe', async () => {
            const noToken = await request(app).get(`/api/receptionists/${UNKNOWN_UUID}`);
            expect(noToken.status).toBe(401);

            const badId = await request(app)
                .get('/api/receptionists/abc')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(badId.status).toBe(400);

            const missing = await request(app)
                .get(`/api/receptionists/${UNKNOWN_UUID}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(missing.status).toBe(404);
        });
    });

    describe('Listar Recepcionistas de una sucursal (GET /api/shops/:id/receptionists)', () => {
        test('Debe listar solo los recepcionistas activos de la sucursal', async () => {
            const active = await insertReceptionist(shopId, shiftId);
            const inactive = await insertReceptionist(shopId, shiftId, { isDeleted: true });

            const res = await request(app)
                .get(`/api/shops/${shopId}/receptionists`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            const ids = res.body.data.map((r: { userId: string }) => r.userId);
            expect(ids).toContain(active.id);
            expect(ids).not.toContain(inactive.id);
        });

        test('Con includeInactive=true también incluye a los dados de baja', async () => {
            const inactive = await insertReceptionist(shopId, shiftId, { isDeleted: true });

            const res = await request(app)
                .get(`/api/shops/${shopId}/receptionists?includeInactive=true`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            const ids = res.body.data.map((r: { userId: string }) => r.userId);
            expect(ids).toContain(inactive.id);
        });

        test('Una sucursal sin recepcionistas devuelve un arreglo vacío', async () => {
            const res = await request(app)
                .get(`/api/shops/${emptyShopId}/receptionists`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });

        test('Debe responder 403 para una sucursal de otro manager y para un cliente', async () => {
            const otherShop = await request(app)
                .get(`/api/shops/${otherShopId}/receptionists`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(otherShop.status).toBe(403);

            const asClient = await request(app)
                .get(`/api/shops/${shopId}/receptionists`)
                .set('Authorization', `Bearer ${clientToken}`);
            expect(asClient.status).toBe(403);
        });

        test('Debe responder 401 sin token, 400 con ID inválido y 404 si la sucursal no existe', async () => {
            const noToken = await request(app).get(`/api/shops/${shopId}/receptionists`);
            expect(noToken.status).toBe(401);

            const badId = await request(app)
                .get('/api/shops/abc/receptionists')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(badId.status).toBe(400);

            const missing = await request(app)
                .get(`/api/shops/${UNKNOWN_UUID}/receptionists`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(missing.status).toBe(404);
        });
    });

    describe('Actualizar Recepcionista (PUT /api/receptionists/:id)', () => {
        test('Debe responder 200 y actualizar los datos personales', async () => {
            const rec = await insertReceptionist(shopId, shiftId);
            const res = await request(app)
                .put(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ firstName: 'Actualizado', gender: 'other' });

            expect(res.status).toBe(200);
            expect(res.body.data.firstName).toBe('Actualizado');
            expect(res.body.data.gender).toBe('other');
            expect(res.body.data.shopId).toBe(shopId);
        });

        test('No modifica la sucursal ni el turno aunque se envíen', async () => {
            const rec = await insertReceptionist(shopId, shiftId);
            const res = await request(app)
                .put(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ firstName: 'Mismo', shopId: emptyShopId, shiftId: otherShiftId });

            expect(res.status).toBe(200);
            expect(res.body.data.shopId).toBe(shopId);
            expect(res.body.data.shiftId).toBe(shiftId);
        });

        test('Debe responder 400 con cuerpo vacío', async () => {
            const rec = await insertReceptionist(shopId, shiftId);
            const res = await request(app)
                .put(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({});
            expect(res.status).toBe(400);
        });

        test('Debe responder 409 si el correo o teléfono pertenecen a otro usuario', async () => {
            const rec = await insertReceptionist(shopId, shiftId);
            const other = await insertReceptionist(shopId, shiftId);

            const dupEmail = await request(app)
                .put(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ email: other.email });
            expect(dupEmail.status).toBe(409);

            const otherPhone = (await getPool().query('SELECT phone FROM users WHERE id = $1', [other.id])).rows[0]
                .phone;
            const dupPhone = await request(app)
                .put(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ phone: otherPhone });
            expect(dupPhone.status).toBe(409);
        });

        test('Debe responder 409 si el recepcionista está dado de baja', async () => {
            const rec = await insertReceptionist(shopId, shiftId, { isDeleted: true });
            const res = await request(app)
                .put(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ firstName: 'Nuevo' });
            expect(res.status).toBe(409);
        });

        test('Debe responder 403 para el manager de otra sucursal y para un cliente', async () => {
            const rec = await insertReceptionist(shopId, shiftId);

            const otherMgr = await request(app)
                .put(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${otherManagerToken}`)
                .send({ firstName: 'Intruso' });
            expect(otherMgr.status).toBe(403);

            const asClient = await request(app)
                .put(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ firstName: 'Intruso' });
            expect(asClient.status).toBe(403);
        });

        test('Debe responder 404 si el recepcionista no existe', async () => {
            const res = await request(app)
                .put(`/api/receptionists/${UNKNOWN_UUID}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ firstName: 'Nadie' });
            expect(res.status).toBe(404);
        });
    });

    describe('Eliminar Recepcionista (DELETE /api/receptionists/:id)', () => {
        test('Debe responder 200, marcar deleted_at y bloquear su inicio de sesión', async () => {
            const { res: created, body } = await createViaApi();
            const userId = created.body.data.userId;

            const res = await request(app)
                .delete(`/api/receptionists/${userId}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(200);

            const row = await getPool().query('SELECT deleted_at FROM receptionists WHERE user_id = $1', [userId]);
            expect(row.rows[0].deleted_at).not.toBeNull();

            const login = await request(app)
                .post('/api/auth/login')
                .send({ email: body.email, password: body.password });
            expect(login.status).not.toBe(200);
        });

        test('Eliminar a un recepcionista ya dado de baja no modifica su deleted_at', async () => {
            const rec = await insertReceptionist(shopId, shiftId, { isDeleted: true });
            const before = (await getPool().query('SELECT deleted_at FROM receptionists WHERE user_id = $1', [rec.id]))
                .rows[0].deleted_at;

            const res = await request(app)
                .delete(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(200);

            const after = (await getPool().query('SELECT deleted_at FROM receptionists WHERE user_id = $1', [rec.id]))
                .rows[0].deleted_at;
            expect(after).toEqual(before);
        });

        test('Debe responder 403 para el manager de otra sucursal y para un cliente', async () => {
            const rec = await insertReceptionist(shopId, shiftId);

            const otherMgr = await request(app)
                .delete(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${otherManagerToken}`);
            expect(otherMgr.status).toBe(403);

            const asClient = await request(app)
                .delete(`/api/receptionists/${rec.id}`)
                .set('Authorization', `Bearer ${clientToken}`);
            expect(asClient.status).toBe(403);

            const row = await getPool().query('SELECT deleted_at FROM receptionists WHERE user_id = $1', [rec.id]);
            expect(row.rows[0].deleted_at).toBeNull();
        });

        test('Debe responder 404 si no existe y 400 con ID inválido', async () => {
            const missing = await request(app)
                .delete(`/api/receptionists/${UNKNOWN_UUID}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(missing.status).toBe(404);

            const badId = await request(app)
                .delete('/api/receptionists/abc')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(badId.status).toBe(400);
        });
    });
});
