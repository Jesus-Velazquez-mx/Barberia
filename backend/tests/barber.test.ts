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
        // CORRECCIÓN AQUÍ: Usamos un prefijo muy corto ('ShopB') para no pasarnos de 50 caracteres.
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
        let reactivatedBarberId: string;

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
            
            reactivatedBarberId = barberToDeactivateId;
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
        let sampleBarberId: string;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName: 'Carlos',
                    lastName: 'Gómez',
                    email: `carlos_${Date.now()}@test.com`,
                    birthDate: '1992-03-15',
                    gender: 'M',
                    shopId: shopId,
                    shiftId: shiftId
                });
            sampleBarberId = res.body.data.id;
            createdBarberIds.push(sampleBarberId);
        });

        test('Debe responder 200 y retornar los barberos activos de la sucursal para cualquier usuario', async () => {
            const res = await request(app)
                .get(`/api/barbers/shop/${shopId}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            
            const ids = res.body.data.map((b: any) => b.id);
            expect(ids).toContain(sampleBarberId);
        });

        test('Debe responder 200 y retornar el detalle de un barbero', async () => {
            const res = await request(app)
                .get(`/api/barbers/${sampleBarberId}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(sampleBarberId);
            expect(res.body.data.firstName).toBe('Carlos');
        });

        test('Debe responder 400 si el ID de la sucursal no es un UUID válido', async () => {
            const res = await request(app)
                .get('/api/barbers/shop/invalid-id')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(400);
            expect(JSON.stringify(res.body.error)).toMatch(/Invalid shop ID format/i);
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