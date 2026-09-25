import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { loadConfig } from '../src/config/globalConfig.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

export const globalConfig = loadConfig();
const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const createdEmails: string[] = [];

// Limpieza en orden seguro: los barberos referencian la tienda (RESTRICT) y la
// tienda referencia al manager (RESTRICT), así que hay que borrar en ese orden.
const createdBarberIds: string[] = [];
const createdShopIds: string[] = [];
const createdManagerIds: string[] = [];
const createdClientIds: string[] = [];

let uniqueCounter = 0;
const generateUniqueEmail = () => {
    uniqueCounter += 1;
    return `update_test_${Date.now()}_${uniqueCounter}@mrbarber.com`;
};
const generateUniquePhone = () => {
    uniqueCounter += 1;
    return `${Date.now()}${uniqueCounter}`.slice(-10);
};
const generateUniqueShopName = () => {
    uniqueCounter += 1;
    return `Test Shop ${Date.now()}_${uniqueCounter}`;
};

const mintToken = (id: string, role: UserRole, email: string): string =>
    signToken({ id, role, email } as User);

const insertUser = async (role: UserRole): Promise<{ id: string; email: string }> => {
    const email = generateUniqueEmail();
    const result = await getPool().query(
        `INSERT INTO users (role, email, phone, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, 'unused', 'Test', 'User') RETURNING id`,
        [role, email, generateUniquePhone()]
    );
    return { id: result.rows[0].id, email };
};

const insertManager = async () => {
    const manager = await insertUser('manager');
    await getPool().query('INSERT INTO managers (user_id, title) VALUES ($1, $2)', [manager.id, 'Manager']);
    createdManagerIds.push(manager.id);
    return manager;
};

const insertShop = async (managerId: string): Promise<string> => {
    const result = await getPool().query(
        `INSERT INTO shops (name, manager_id) VALUES ($1, $2) RETURNING id`,
        [generateUniqueShopName(), managerId]
    );
    const id = result.rows[0].id;
    createdShopIds.push(id);
    return id;
};

const insertBarber = async (shopId: string) => {
    const barber = await insertUser('barber');
    const shift = await getPool().query(`SELECT id FROM shifts WHERE name = 'morning'`);
    await getPool().query(
        `INSERT INTO barbers (user_id, shop_id, shift_id) VALUES ($1, $2, $3)`,
        [barber.id, shopId, shift.rows[0].id]
    );
    createdBarberIds.push(barber.id);
    return barber;
};

const registerClient = async () => {
    const email = generateUniqueEmail();
    createdEmails.push(email);

    const response = await request(app).post('/api/auth/register').send({
        firstName: 'Test',
        lastName: 'User',
        phone: generateUniquePhone(),
        email,
        password: 'password123'
    });

    return {
        id: response.body.data.user.id,
        email,
        token: response.body.data.token as string
    };
};

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    if (createdBarberIds.length > 0) {
        await getPool().query('DELETE FROM users WHERE id = ANY($1)', [createdBarberIds]);
    }
    if (createdShopIds.length > 0) {
        await getPool().query('DELETE FROM shops WHERE id = ANY($1)', [createdShopIds]);
    }
    if (createdManagerIds.length > 0) {
        await getPool().query('DELETE FROM users WHERE id = ANY($1)', [createdManagerIds]);
    }
    if (createdClientIds.length > 0) {
        await getPool().query('DELETE FROM users WHERE id = ANY($1)', [createdClientIds]);
    }
    if (createdEmails.length > 0) {
        await getPool().query('DELETE FROM users WHERE email = ANY($1)', [createdEmails]);
    }
    await closeDB();
});

describe('Pruebas de PUT /api/users', () => {
    test('debe devolver 200 y los datos actualizados cuando un cliente se actualiza a sí mismo', async () => {
        const client = await registerClient();
        const newPhone = generateUniquePhone();

        const response = await request(app)
            .put('/api/users')
            .set('Authorization', `Bearer ${client.token}`)
            .send({ user: { id: client.id, firstName: 'Actualizado', phone: newPhone } });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.firstName).toBe('Actualizado');
        expect(response.body.data.phone).toBe(newPhone);
        expect(response.body.data).not.toHaveProperty('password_hash');
    });

    test('debe devolver 401 con un token inválido', async () => {
        const client = await registerClient();

        const response = await request(app)
            .put('/api/users')
            .set('Authorization', 'Bearer token.invalido.aqui')
            .send({ user: { id: client.id, firstName: 'Nuevo' } });

        expect(response.statusCode).toBe(400);
    });

    test('debe devolver 403 cuando un cliente intenta actualizar a otro cliente', async () => {
        const clientA = await registerClient();
        const clientB = await registerClient();

        const response = await request(app)
            .put('/api/users')
            .set('Authorization', `Bearer ${clientA.token}`)
            .send({ user: { id: clientB.id, firstName: 'Intruso' } });

        expect(response.statusCode).toBe(403);
    });

    test('debe devolver 404 cuando el usuario objetivo no existe', async () => {
        const client = await registerClient();

        const response = await request(app)
            .put('/api/users')
            .set('Authorization', `Bearer ${client.token}`)
            .send({ user: { id: '00000000-0000-0000-0000-000000000000', firstName: 'Nadie' } });

        expect(response.statusCode).toBe(404);
    });

    test('debe devolver 409 cuando el correo ya pertenece a otro usuario', async () => {
        const clientA = await registerClient();
        const clientB = await registerClient();

        const response = await request(app)
            .put('/api/users')
            .set('Authorization', `Bearer ${clientA.token}`)
            .send({ user: { id: clientA.id, email: clientB.email } });

        expect(response.statusCode).toBe(409);
    });

    test('debe devolver 403 ACCOUNT_DEACTIVATED cuando el usuario objetivo (barbero) está dado de baja', async () => {
        const manager = await insertManager();
        const shopId = await insertShop(manager.id);
        const barber = await insertBarber(shopId);
        await getPool().query('UPDATE barbers SET deleted_at = now() WHERE user_id = $1', [barber.id]);
        const token = mintToken(manager.id, 'manager', manager.email);

        const response = await request(app)
            .put('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ user: { id: barber.id, firstName: 'Nuevo' } });

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe('Account is deactivated');
    });

    test('debe devolver 403 ACCOUNT_DEACTIVATED cuando el usuario que realiza la petición (manager) está dado de baja', async () => {
        const manager = await insertManager();
        await getPool().query('UPDATE managers SET deleted_at = now() WHERE user_id = $1', [manager.id]);
        const token = mintToken(manager.id, 'manager', manager.email);

        const target = await insertUser('client');
        createdClientIds.push(target.id);

        const response = await request(app)
            .put('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ user: { id: target.id, firstName: 'Nuevo' } });

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe('Account is deactivated');
    });
});
