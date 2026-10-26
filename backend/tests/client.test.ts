import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';
import {
    generateUniqueEmail as uniqueEmail,
    generateUniquePhone,
    generateUniqueName as uniqueName,
} from './helpers/uniqueValues.js';

const { connectDB, closeDB, getPool } = connection;

// Configuración de app Express aislada para pruebas
const app = express();
app.use(express.json());
app.use('/api', router);

// Arreglos para rastreo y limpieza al finalizar los tests
const createdUserIds: string[] = [];
const createdShopIds: string[] = [];

const generateEmail = (prefix = 'client_test') => uniqueEmail(prefix);
const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

// Helpers para preparar los fixtures de prueba
const insertUser = async (role: UserRole): Promise<{ id: string; email: string; phone: string }> => {
    const email = generateEmail(role);
    const phone = generateUniquePhone();
    const result = await getPool().query(
        `INSERT INTO users (role, email, phone, password_hash, first_name, last_name, birth_date, gender)
         VALUES ($1, $2, $3, 'unused_hash', 'Fixture', 'User', '1990-01-01', 'other') RETURNING id`,
        [role, email, phone]
    );
    const id = result.rows[0].id;
    createdUserIds.push(id);
    return { id, email, phone };
};

const insertManager = async () => {
    const user = await insertUser('manager');
    await getPool().query('INSERT INTO managers (user_id, title) VALUES ($1, $2)', [user.id, 'Manager']);
    return user;
};

const insertShop = async (managerId: string): Promise<string> => {
    const result = await getPool().query(
        `INSERT INTO shops (name, manager_id) VALUES ($1, $2) RETURNING id`,
        [uniqueName('Shop'), managerId]
    );
    const id = result.rows[0].id;
    createdShopIds.push(id);
    return id;
};

const insertReceptionist = async (shopId: string) => {
    const user = await insertUser('receptionist');
    const shift = await getPool().query(`SELECT id FROM shifts LIMIT 1`);
    await getPool().query(
        `INSERT INTO receptionists (user_id, shop_id, shift_id) VALUES ($1, $2, $3)`,
        [user.id, shopId, shift.rows[0].id]
    );
    return user;
};

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    const pool = getPool();
    if (createdUserIds.length > 0) {
        // Limpieza en cascada respetando restricciones
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

describe('CRUD de Clientes (/api/clients)', () => {
    let managerUser: { id: string; email: string };
    let receptionistUser: { id: string; email: string };
    let managerToken: string;
    let receptionistToken: string;

    beforeAll(async () => {
        managerUser = await insertManager();
        const shopId = await insertShop(managerUser.id);
        receptionistUser = await insertReceptionist(shopId);

        managerToken = mintToken(managerUser.id, 'manager', managerUser.email);
        receptionistToken = mintToken(receptionistUser.id, 'receptionist', receptionistUser.email);
    });

    // =========================================================================
    // 1. CREATE (POST /api/clients)
    // =========================================================================
    describe('POST /api/clients (Creación de Clientes)', () => {
        test('Debe crear un cliente exitosamente (201) manipulando users y clients en transacción', async () => {
            const email = generateEmail('create_ok');
            const phone = generateUniquePhone();

            const response = await request(app)
                .post('/api/clients')
                .send({
                    firstName: 'Carlos',
                    lastName: 'Ramírez',
                    email,
                    password: 'password123',
                    phone,
                    birthDate: '1995-03-20',
                    gender: 'male',
                    facialStructureType: 'oval',
                    completedServicesCount: 2,
                });

            expect(response.status).toBe(201);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.email).toBe(email);
            expect(response.body.data.phone).toBe(phone);
            expect(response.body.data.facialStructureType).toBe('oval');
            expect(response.body.data.completedServicesCount).toBe(2);

            const clientId = response.body.data.id;
            createdUserIds.push(clientId);

            // Verificación en base de datos de ambas tablas manipuladas
            const pool = getPool();
            const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [clientId]);
            expect(userCheck.rows.length).toBe(1);
            expect(userCheck.rows[0].role).toBe('client');
            expect(userCheck.rows[0].email).toBe(email);

            const clientCheck = await pool.query('SELECT * FROM clients WHERE user_id = $1', [clientId]);
            expect(clientCheck.rows.length).toBe(1);
            expect(clientCheck.rows[0].facial_structure_type).toBe('oval');
            expect(clientCheck.rows[0].completed_services_count).toBe(2);
        });

        test('Debe permitir a un MANAGER registrar un cliente con token', async () => {
            const email = generateEmail('mgr_reg');
            const phone = generateUniquePhone();

            const response = await request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName: 'Cliente',
                    lastName: 'Manager',
                    email,
                    password: 'password123',
                    phone,
                    birthDate: '1992-06-10',
                    gender: 'other',
                });

            expect(response.status).toBe(201);
            expect(response.body.data.id).toBeDefined();
            createdUserIds.push(response.body.data.id);
        });

        test('Debe permitir a un RECEPTIONIST registrar un cliente con token', async () => {
            const email = generateEmail('rec_reg');
            const phone = generateUniquePhone();

            const response = await request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${receptionistToken}`)
                .send({
                    firstName: 'Cliente',
                    lastName: 'Recepción',
                    email,
                    password: 'password123',
                    phone,
                    birthDate: '1994-08-12',
                    gender: 'female',
                });

            expect(response.status).toBe(201);
            createdUserIds.push(response.body.data.id);
        });

        test('Debe responder 403 Forbidden si un CLIENTE intenta registrar a otro cliente con su token', async () => {
            const existingClient = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [existingClient.id]);
            const clientToken = mintToken(existingClient.id, 'client', existingClient.email);

            const response = await request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    firstName: 'Otro',
                    lastName: 'Cliente',
                    email: generateEmail('forbidden_client'),
                    password: 'password123',
                    birthDate: '1998-01-01',
                    gender: 'other',
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('Clients cannot create other client accounts');
        });

        test('Debe responder 409 Conflict si el correo ya está registrado', async () => {
            const email = generateEmail('dup_email');
            const phone1 = generateUniquePhone();
            const phone2 = generateUniquePhone();

            // Primer registro
            const res1 = await request(app).post('/api/clients').send({
                firstName: 'Primero',
                lastName: 'Uno',
                email,
                password: 'password123',
                phone: phone1,
                birthDate: '1990-01-01',
                gender: 'male',
            });
            expect(res1.status).toBe(201);
            createdUserIds.push(res1.body.data.id);

            // Intento con el mismo correo
            const res2 = await request(app).post('/api/clients').send({
                firstName: 'Segundo',
                lastName: 'Dos',
                email,
                password: 'password456',
                phone: phone2,
                birthDate: '1991-01-01',
                gender: 'female',
            });
            expect(res2.status).toBe(409);
            expect(res2.body.message).toContain('Email is already registered');
        });

        test('Debe responder 409 Conflict si el teléfono ya está registrado', async () => {
            const email1 = generateEmail('phone_one');
            const email2 = generateEmail('phone_two');
            const sharedPhone = generateUniquePhone();

            // Primer registro
            const res1 = await request(app).post('/api/clients').send({
                firstName: 'Uno',
                lastName: 'Pérez',
                email: email1,
                password: 'password123',
                phone: sharedPhone,
                birthDate: '1990-01-01',
                gender: 'male',
            });
            expect(res1.status).toBe(201);
            createdUserIds.push(res1.body.data.id);

            // Segundo registro con el mismo teléfono
            const res2 = await request(app).post('/api/clients').send({
                firstName: 'Dos',
                lastName: 'Gómez',
                email: email2,
                password: 'password123',
                phone: sharedPhone,
                birthDate: '1992-02-02',
                gender: 'female',
            });
            expect(res2.status).toBe(409);
            expect(res2.body.message).toContain('Phone is already registered');
        });

        test('Debe responder 400 Bad Request ante datos inválidos (Zod validation)', async () => {
            const response = await request(app).post('/api/clients').send({
                firstName: '',
                email: 'not-an-email',
                password: '123', // menos de 6 caracteres
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });
    });

    // =========================================================================
    // 2. READ (GET /api/clients & GET /api/clients/:id)
    // =========================================================================
    describe('GET /api/clients (Listar) & GET /api/clients/:id (Detalle)', () => {
        let testClient: { id: string; email: string };
        let clientToken: string;

        beforeAll(async () => {
            testClient = await insertUser('client');
            await getPool().query(
                `INSERT INTO clients (user_id, facial_structure_type, completed_services_count) VALUES ($1, 'round', 3)`,
                [testClient.id]
            );
            clientToken = mintToken(testClient.id, 'client', testClient.email);
        });

        test('GET /api/clients - MANAGER puede listar todos los clientes (200)', async () => {
            const response = await request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(200);
            const found = response.body.data.find((c: { id: string }) => c.id === testClient.id);
            expect(found).toBeDefined();
            expect(found.facialStructureType).toBe('round');
            expect(found.completedServicesCount).toBe(3);
        });

        test('GET /api/clients - RECEPTIONIST puede listar todos los clientes (200)', async () => {
            const response = await request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${receptionistToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /api/clients - CLIENT recibe 403 Forbidden al intentar listar', async () => {
            const response = await request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('Only staff can list clients');
        });

        test('GET /api/clients - 401 Unauthorized sin token', async () => {
            const response = await request(app).get('/api/clients');
            expect(response.status).toBe(401);
        });

        test('GET /api/clients/:id - CLIENT puede consultar su propio detalle (200)', async () => {
            const response = await request(app)
                .get(`/api/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(testClient.id);
            expect(response.body.data.email).toBe(testClient.email);
            expect(response.body.data.facialStructureType).toBe('round');
        });

        test('GET /api/clients/:id - MANAGER puede consultar el detalle de cualquier cliente (200)', async () => {
            const response = await request(app)
                .get(`/api/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(testClient.id);
        });

        test('GET /api/clients/:id - RECEPTIONIST puede consultar el detalle de cualquier cliente (200)', async () => {
            const response = await request(app)
                .get(`/api/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${receptionistToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(testClient.id);
        });

        test('GET /api/clients/:id - CLIENT recibe 403 Forbidden al consultar a otro cliente', async () => {
            const otherClient = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [otherClient.id]);

            const response = await request(app)
                .get(`/api/clients/${otherClient.id}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('You do not have permission to view this client');
        });

        test('GET /api/clients/:id - 404 Not Found para cliente inexistente', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/api/clients/${nonExistentId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Client not found');
        });

        test('GET /api/clients/:id - 400 Bad Request para UUID inválido', async () => {
            const response = await request(app)
                .get('/api/clients/no-es-uuid')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // 3. UPDATE (PUT /api/clients/:id)
    // =========================================================================
    describe('PUT /api/clients/:id (Actualización de Clientes)', () => {
        test('Un cliente puede actualizar su propio perfil (nombre, teléfono, estructura facial)', async () => {
            const clientUser = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientUser.id]);
            const token = mintToken(clientUser.id, 'client', clientUser.email);

            const newPhone = generateUniquePhone();
            const response = await request(app)
                .put(`/api/clients/${clientUser.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    firstName: 'Alejandro',
                    phone: newPhone,
                    facialStructureType: 'square',
                });

            expect(response.status).toBe(200);
            expect(response.body.data.firstName).toBe('Alejandro');
            expect(response.body.data.phone).toBe(newPhone);
            expect(response.body.data.facialStructureType).toBe('square');

            // Comprobación en base de datos
            const pool = getPool();
            const uCheck = await pool.query('SELECT first_name, phone FROM users WHERE id = $1', [clientUser.id]);
            expect(uCheck.rows[0].first_name).toBe('Alejandro');
            expect(uCheck.rows[0].phone).toBe(newPhone);

            const cCheck = await pool.query('SELECT facial_structure_type FROM clients WHERE user_id = $1', [
                clientUser.id,
            ]);
            expect(cCheck.rows[0].facial_structure_type).toBe('square');
        });

        test('Un MANAGER puede actualizar los servicios acumulados (completedServicesCount)', async () => {
            const clientUser = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id, completed_services_count) VALUES ($1, 0)', [
                clientUser.id,
            ]);

            const response = await request(app)
                .put(`/api/clients/${clientUser.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    completedServicesCount: 5,
                });

            expect(response.status).toBe(200);
            expect(response.body.data.completedServicesCount).toBe(5);

            const pool = getPool();
            const dbCheck = await pool.query('SELECT completed_services_count FROM clients WHERE user_id = $1', [
                clientUser.id,
            ]);
            expect(dbCheck.rows[0].completed_services_count).toBe(5);
        });

        test('Un CLIENTE recibe 403 Forbidden si intenta modificar completedServicesCount', async () => {
            const clientUser = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientUser.id]);
            const token = mintToken(clientUser.id, 'client', clientUser.email);

            const response = await request(app)
                .put(`/api/clients/${clientUser.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    completedServicesCount: 99,
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('Clients cannot modify completed services count');
        });

        test('Un CLIENTE recibe 403 Forbidden si intenta actualizar a otro cliente', async () => {
            const clientA = await insertUser('client');
            const clientB = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientA.id]);
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientB.id]);

            const tokenA = mintToken(clientA.id, 'client', clientA.email);

            const response = await request(app)
                .put(`/api/clients/${clientB.id}`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    firstName: 'Hacked',
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('You do not have permission to update this client');
        });

        test('Debe responder 409 Conflict si se actualiza el email a uno en uso por otro usuario', async () => {
            const clientA = await insertUser('client');
            const clientB = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientA.id]);
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientB.id]);

            const tokenA = mintToken(clientA.id, 'client', clientA.email);

            const response = await request(app)
                .put(`/api/clients/${clientA.id}`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    email: clientB.email,
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Email is already registered');
        });

        test('Debe responder 409 Conflict si se actualiza el teléfono a uno en uso por otro usuario', async () => {
            const clientA = await insertUser('client');
            const clientB = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientA.id]);
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientB.id]);

            const tokenA = mintToken(clientA.id, 'client', clientA.email);

            const response = await request(app)
                .put(`/api/clients/${clientA.id}`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    phone: clientB.phone,
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Phone is already registered');
        });

        test('Debe responder 404 Not Found si el cliente no existe', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .put(`/api/clients/${nonExistentId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstName: 'Inexistente',
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Client not found');
        });

        test('Debe responder 400 Bad Request si no se proporciona ningún campo a actualizar', async () => {
            const clientUser = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientUser.id]);
            const token = mintToken(clientUser.id, 'client', clientUser.email);

            const response = await request(app)
                .put(`/api/clients/${clientUser.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // 4. DELETE (DELETE /api/clients/:id)
    // =========================================================================
    describe('DELETE /api/clients/:id (Borrado Físico de Clientes)', () => {
        test('Un cliente puede eliminar su propia cuenta mediante borrado físico (Hard delete)', async () => {
            const clientUser = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientUser.id]);
            const token = mintToken(clientUser.id, 'client', clientUser.email);

            const response = await request(app)
                .delete(`/api/clients/${clientUser.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Client deleted successfully');

            // Verificar borrado físico en ambas tablas: clients y users
            const pool = getPool();
            const clientsCheck = await pool.query('SELECT * FROM clients WHERE user_id = $1', [clientUser.id]);
            expect(clientsCheck.rows.length).toBe(0);

            const usersCheck = await pool.query('SELECT * FROM users WHERE id = $1', [clientUser.id]);
            expect(usersCheck.rows.length).toBe(0);
        });

        test('Un MANAGER puede eliminar cualquier cuenta de cliente', async () => {
            const clientUser = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientUser.id]);

            const response = await request(app)
                .delete(`/api/clients/${clientUser.id}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(200);

            const pool = getPool();
            const check = await pool.query('SELECT * FROM users WHERE id = $1', [clientUser.id]);
            expect(check.rows.length).toBe(0);
        });

        test('Un RECEPTIONIST recibe 403 Forbidden al intentar eliminar un cliente', async () => {
            const clientUser = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientUser.id]);

            const response = await request(app)
                .delete(`/api/clients/${clientUser.id}`)
                .set('Authorization', `Bearer ${receptionistToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('You do not have permission to delete this account');

            // La base de datos debe conservarse intacta
            const pool = getPool();
            const check = await pool.query('SELECT * FROM users WHERE id = $1', [clientUser.id]);
            expect(check.rows.length).toBe(1);
        });

        test('Un CLIENTE recibe 403 Forbidden al intentar eliminar la cuenta de otro cliente', async () => {
            const clientA = await insertUser('client');
            const clientB = await insertUser('client');
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientA.id]);
            await getPool().query('INSERT INTO clients (user_id) VALUES ($1)', [clientB.id]);

            const tokenA = mintToken(clientA.id, 'client', clientA.email);

            const response = await request(app)
                .delete(`/api/clients/${clientB.id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('You do not have permission to delete this account');
        });

        test('Debe responder 404 Not Found si el cliente a eliminar no existe', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .delete(`/api/clients/${nonExistentId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Client not found');
        });

        test('Debe responder 401 Unauthorized si no se envía token', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app).delete(`/api/clients/${nonExistentId}`);

            expect(response.status).toBe(401);
        });
    });
});
