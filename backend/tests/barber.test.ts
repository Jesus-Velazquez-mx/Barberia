import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import {
    insertManager,
    insertUser,
    cleanupFixtures,
    generateUniqueFixtureName,
} from './helpers/availabilityFixtures.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

// Configuración de la aplicación Express para pruebas
const app = express();
app.use(express.json());
app.use('/api', router);

// Función utilitaria para generar tokens JWT de prueba
const mintToken = (id: string, role: UserRole, email: string): string =>
    signToken({ id, role, email } as User);

describe('Pruebas de endpoints de Barberos (Barbers)', () => {
    let dummyManager: { id: string; email: string };
    let clientUser: { id: string; email: string };
    let managerToken: string;
    let clientToken: string;

    let shopId: string;
    let shiftId: string;
    
    // IDs de barberos creados durante los tests para limpieza posterior
    const createdBarberIds: string[] = [];

    beforeAll(async () => {
        await connectDB();
        const pool = getPool();

        // 1. Crear usuarios y tokens
        dummyManager = await insertManager();
        clientUser = await insertUser('client');

        managerToken = mintToken(dummyManager.id, 'manager', dummyManager.email);
        clientToken = mintToken(clientUser.id, 'client', clientUser.email);

        // 2. Obtener un turno (shift) existente en el catálogo fijo
        const shiftRes = await pool.query(`SELECT id FROM shifts LIMIT 1`);
        shiftId = shiftRes.rows[0].id;

        // 3. Crear una sucursal (shop) de prueba asignada al manager
        // Usamos un prefijo muy corto ('ShopB') para no pasarnos de 50 caracteres.
        const shopRes = await pool.query(
            `INSERT INTO shops (name, manager_id) VALUES ($1, $2) RETURNING id`,
            [generateUniqueFixtureName('ShopB'), dummyManager.id]
        );
        shopId = shopRes.rows[0].id;
    });

    afterAll(async () => {
        const pool = getPool();
        // Limpiar barberos y la sucursal de prueba
        if (createdBarberIds.length > 0) {
            await pool.query('DELETE FROM barbers WHERE id = ANY($1::uuid[])', [createdBarberIds]);
        }
        if (shopId) {
            await pool.query('DELETE FROM shops WHERE id = $1', [shopId]);
        }
        await cleanupFixtures();
        await closeDB();
    });

    describe('Registrar Barbero (POST /api/barbers)', () => {
        let activeBarberEmail: string;
        let inactiveBarberEmail: string;

        beforeAll(() => {
            activeBarberEmail = `active_${Date.now()}@test.com`;
            inactiveBarberEmail = `inactive_${Date.now()}@test.com`;
        });

        test('Debe responder 201 y crear un nuevo barbero correctamente (Solo Manager)', async () => {
            const newBarberData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: activeBarberEmail,
                phone: '5551234567',
                birthDate: '1990-05-20',
                gender: 'M',
                shopId: shopId,
                shiftId: shiftId,
                bio: 'Excelente barbero clásico.',
                isAcceptingBookings: true
            };

            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(newBarberData);

            expect(res.status).toBe(201);
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.email).toBe(activeBarberEmail);
            createdBarberIds.push(res.body.data.id);
        });

        test('Debe responder 403 si un cliente intenta registrar un barbero', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    firstName: 'Cliente',
                    lastName: 'Intruso',
                    email: `client_${Date.now()}@test.com`,
                    birthDate: '1995-01-01',
                    gender: 'M',
                    shopId: shopId,
                    shiftId: shiftId
                });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized to create a barber/i);
        });

        test('Debe responder 409 si se intenta registrar un correo de un barbero ACTIVO', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName: 'Clon',
                    lastName: 'Pérez',
                    email: activeBarberEmail, // Mismo correo del barbero activo
                    phone: '5559998888',
                    birthDate: '1990-05-20',
                    gender: 'M',
                    shopId: shopId,
                    shiftId: shiftId
                });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/Email already in use/i);
        });

        test('Debe realizar un UPSERT (Reactivación) si el correo pertenece a un barbero INACTIVO', async () => {
            // 1. Creamos un barbero temporal
            const tempRes = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName: 'Barbero',
                    lastName: 'Inactivo',
                    email: inactiveBarberEmail,
                    birthDate: '1985-10-10',
                    gender: 'M',
                    shopId: shopId,
                    shiftId: shiftId
                });
            
            const barberToDeactivateId = tempRes.body.data.id;
            createdBarberIds.push(barberToDeactivateId);

            // 2. Lo damos de baja (Soft Delete)
            await request(app)
                .delete(`/api/barbers/${barberToDeactivateId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            // 3. Verificamos que esté de baja en BD
            const pool = getPool();
            const checkDeleted = await pool.query('SELECT deleted_at FROM barbers WHERE id = $1', [barberToDeactivateId]);
            expect(checkDeleted.rows[0].deleted_at).not.toBeNull();

            // 4. Intentamos crear un barbero con el MISMO correo, pero con datos nuevos
            const reactivateRes = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName: 'Barbero Reactivado',
                    lastName: 'Con Nuevo Apellido',
                    email: inactiveBarberEmail,
                    phone: '5557773333',
                    birthDate: '1985-10-10',
                    gender: 'M',
                    shopId: shopId,
                    shiftId: shiftId,
                    bio: 'Volví a la barbería.'
                });

            // Debería retornar 201 indicando que el proceso fue exitoso
            expect(reactivateRes.status).toBe(201);
            expect(reactivateRes.body.data.id).toBe(barberToDeactivateId); // Es el MISMO ID
            expect(reactivateRes.body.data.firstName).toBe('Barbero Reactivado');
            expect(reactivateRes.body.data.bio).toBe('Volví a la barbería.');

            // 5. Verificamos que deleted_at ahora es NULL
            const checkReactivated = await pool.query('SELECT deleted_at FROM barbers WHERE id = $1', [barberToDeactivateId]);
            expect(checkReactivated.rows[0].deleted_at).toBeNull();
        });

        test('Debe responder 400 si faltan campos obligatorios en el registro (Zod)', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName: 'Incompleto'
                    // Faltan lastName, email, etc.
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
    });

    describe('Listar y Obtener Barberos (GET)', () => {
        const PUBLIC_KEYS = ['bio', 'firstName', 'id', 'lastName', 'shiftId', 'shopId'];
        const STAFF_KEYS = [
            ...PUBLIC_KEYS,
            'birthDate', 'createdAt', 'deletedAt', 'email', 'gender', 'isAcceptingBookings', 'phone', 'updatedAt'
        ].sort();

        let sampleBarberId: string;
        let notAcceptingBarberId: string;
        let deletedBarberId: string;
        let receptionistToken: string;

        const createBarber = async (firstName: string, extra: Record<string, unknown> = {}): Promise<string> => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName,
                    lastName: 'Gómez',
                    email: `${firstName.toLowerCase()}_${Date.now()}@test.com`,
                    birthDate: '1992-03-15',
                    gender: 'M',
                    shopId: shopId,
                    shiftId: shiftId,
                    ...extra
                });
            expect(res.status).toBe(201);
            createdBarberIds.push(res.body.data.id);
            return res.body.data.id;
        };

        const listShopBarbers = (token?: string, query = '') => {
            const req = request(app).get(`/api/shops/${shopId}/barbers${query}`);
            return token ? req.set('Authorization', `Bearer ${token}`) : req;
        };

        beforeAll(async () => {
            const receptionist = await insertUser('receptionist');
            receptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);

            sampleBarberId = await createBarber('Carlos');
            notAcceptingBarberId = await createBarber('Nacho', { isAcceptingBookings: false });
            deletedBarberId = await createBarber('Dario');

            const del = await request(app)
                .delete(`/api/barbers/${deletedBarberId}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(del.status).toBe(200);
        });

        describe('GET /api/shops/:id/barbers', () => {
            test('Usuario anónimo: 200 sin token, solo vista pública de barberos activos que aceptan reservas', async () => {
                const res = await listShopBarbers();

                expect(res.status).toBe(200);
                const ids = res.body.data.map((b: any) => b.id);
                expect(ids).toContain(sampleBarberId);
                expect(ids).not.toContain(notAcceptingBarberId);
                expect(ids).not.toContain(deletedBarberId);
                for (const barber of res.body.data) {
                    expect(Object.keys(barber).sort()).toEqual(PUBLIC_KEYS);
                }
            });

            test('Cliente: recibe la misma vista pública y includeInactive se ignora', async () => {
                const res = await listShopBarbers(clientToken, '?includeInactive=true');

                expect(res.status).toBe(200);
                const ids = res.body.data.map((b: any) => b.id);
                expect(ids).toContain(sampleBarberId);
                expect(ids).not.toContain(notAcceptingBarberId);
                expect(ids).not.toContain(deletedBarberId);
                for (const barber of res.body.data) {
                    expect(Object.keys(barber).sort()).toEqual(PUBLIC_KEYS);
                }
            });

            test.each([
                ['Gerente', () => managerToken],
                ['Recepcionista', () => receptionistToken],
            ])('%s: perfil completo, incluye a quienes no aceptan reservas y excluye a los dados de baja por defecto', async (_role, getToken) => {
                const res = await listShopBarbers(getToken());

                expect(res.status).toBe(200);
                const ids = res.body.data.map((b: any) => b.id);
                expect(ids).toContain(sampleBarberId);
                expect(ids).toContain(notAcceptingBarberId);
                expect(ids).not.toContain(deletedBarberId);
                for (const barber of res.body.data) {
                    expect(Object.keys(barber).sort()).toEqual(STAFF_KEYS);
                    expect(barber.deletedAt).toBeNull();
                }
            });

            test.each([
                ['Gerente', () => managerToken],
                ['Recepcionista', () => receptionistToken],
            ])('%s: includeInactive=true incluye a los barberos dados de baja', async (_role, getToken) => {
                const res = await listShopBarbers(getToken(), '?includeInactive=true');

                expect(res.status).toBe(200);
                const deleted = res.body.data.find((b: any) => b.id === deletedBarberId);
                expect(deleted).toBeDefined();
                expect(deleted.deletedAt).not.toBeNull();
                expect(res.body.data.map((b: any) => b.id)).toContain(sampleBarberId);
            });

            test('Debe responder 401 si el token es inválido', async () => {
                const res = await listShopBarbers('token-invalido');

                expect(res.status).toBe(401);
            });

            test('Debe responder 403 si la cuenta del personal está desactivada', async () => {
                const inactiveManager = await insertManager();
                await getPool().query('UPDATE managers SET deleted_at = NOW() WHERE user_id = $1', [inactiveManager.id]);
                const token = mintToken(inactiveManager.id, 'manager', inactiveManager.email);

                const res = await listShopBarbers(token);

                expect(res.status).toBe(403);
            });

            test('Debe responder 400 si el ID de la sucursal no es un UUID válido', async () => {
                const res = await request(app).get('/api/shops/invalid-id/barbers');

                expect(res.status).toBe(400);
                expect(JSON.stringify(res.body.error)).toMatch(/Invalid shop ID format/i);
            });

            test('Debe responder 404 si la sucursal no existe', async () => {
                const res = await request(app).get('/api/shops/00000000-0000-4000-8000-000000000000/barbers');

                expect(res.status).toBe(404);
            });

            test('La ruta anterior GET /api/barbers/shop/:id ya no existe', async () => {
                const res = await request(app)
                    .get(`/api/barbers/shop/${shopId}`)
                    .set('Authorization', `Bearer ${clientToken}`);

                expect(res.status).toBe(404);
            });
        });

        describe('GET /api/barbers/:id', () => {
            test('Cliente: 200 con la vista pública del barbero', async () => {
                const res = await request(app)
                    .get(`/api/barbers/${sampleBarberId}`)
                    .set('Authorization', `Bearer ${clientToken}`);

                expect(res.status).toBe(200);
                expect(res.body.data.id).toBe(sampleBarberId);
                expect(res.body.data.firstName).toBe('Carlos');
                expect(Object.keys(res.body.data).sort()).toEqual(PUBLIC_KEYS);
            });

            test('Cliente: 404 si el barbero está dado de baja o no acepta reservas', async () => {
                for (const id of [deletedBarberId, notAcceptingBarberId]) {
                    const res = await request(app)
                        .get(`/api/barbers/${id}`)
                        .set('Authorization', `Bearer ${clientToken}`);

                    expect(res.status).toBe(404);
                }
            });

            test.each([
                ['Gerente', () => managerToken],
                ['Recepcionista', () => receptionistToken],
            ])('%s: perfil completo, incluso de un barbero dado de baja', async (_role, getToken) => {
                const res = await request(app)
                    .get(`/api/barbers/${deletedBarberId}`)
                    .set('Authorization', `Bearer ${getToken()}`);

                expect(res.status).toBe(200);
                expect(Object.keys(res.body.data).sort()).toEqual(STAFF_KEYS);
                expect(res.body.data.deletedAt).not.toBeNull();
            });

            test('Debe responder 401 sin token', async () => {
                const res = await request(app).get(`/api/barbers/${sampleBarberId}`);

                expect(res.status).toBe(401);
            });
        });
    });

    describe('Editar Perfil de Barbero (PUT /api/barbers)', () => {
        let editBarberId: string;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName: 'Luis',
                    lastName: 'Martínez',
                    email: `luis_${Date.now()}@test.com`,
                    birthDate: '1988-11-22',
                    gender: 'M',
                    shopId: shopId,
                    shiftId: shiftId,
                    isAcceptingBookings: true
                });
            editBarberId = res.body.data.id;
            createdBarberIds.push(editBarberId);
        });

        test('Debe responder 200 y actualizar la biografía e isAcceptingBookings (Manager)', async () => {
            const res = await request(app)
                .put('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    id: editBarberId,
                    bio: 'Biografía actualizada',
                    isAcceptingBookings: false
                });

            expect(res.status).toBe(200);
            expect(res.body.data.bio).toBe('Biografía actualizada');
            expect(res.body.data.isAcceptingBookings).toBe(false);
        });

        test('Debe responder 403 si un cliente intenta actualizar un barbero', async () => {
            const res = await request(app)
                .put('/api/barbers')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    id: editBarberId,
                    bio: 'Hackeo de biografía'
                });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized to update this barber/i);
        });

        test('Debe responder 400 si no se envían campos para actualizar (Zod Refine)', async () => {
            const res = await request(app)
                .put('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    id: editBarberId
                });

            expect(res.status).toBe(400);
            expect(JSON.stringify(res.body.error)).toMatch(/At least one of bio or isAcceptingBookings/i);
        });
    });

    describe('Eliminar Barbero (DELETE /api/barbers/:id)', () => {
        let deleteBarberId: string;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName: 'Pedro',
                    lastName: 'Borrar',
                    email: `pedro_${Date.now()}@test.com`,
                    birthDate: '1995-07-14',
                    gender: 'M',
                    shopId: shopId,
                    shiftId: shiftId
                });
            deleteBarberId = res.body.data.id;
            createdBarberIds.push(deleteBarberId);
        });

        test('Debe responder 403 si un cliente intenta eliminar a un barbero', async () => {
            const res = await request(app)
                .delete(`/api/barbers/${deleteBarberId}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
        });

        test('Debe responder 200 y realizar el borrado lógico del barbero (Manager)', async () => {
            const res = await request(app)
                .delete(`/api/barbers/${deleteBarberId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);

            // Verificar en base de datos que se estableció deleted_at
            const pool = getPool();
            const check = await pool.query('SELECT deleted_at FROM barbers WHERE id = $1', [deleteBarberId]);
            expect(check.rows[0].deleted_at).not.toBeNull();
        });

        test('Debe responder 404 si se intenta eliminar un barbero que no existe', async () => {
            const fakeId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .delete(`/api/barbers/${fakeId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(404);
        });
    });
});