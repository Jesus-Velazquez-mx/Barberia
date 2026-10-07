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

// Limpieza en orden seguro: los barberos referencian la tienda (RESTRICT) y la
// tienda referencia al manager (RESTRICT), así que hay que borrar en ese orden.
const createdBarberIds: string[] = [];
const createdShopIds: string[] = [];
const createdManagerIds: string[] = [];
const createdOtherUserIds: string[] = [];

let uniqueCounter = 0;
const generateUniqueEmail = () => {
    uniqueCounter += 1;
    return `update_barber_test_${Date.now()}_${uniqueCounter}@mrbarber.com`;
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
        `INSERT INTO users (role, email, phone, password_hash, first_name, last_name, birth_date, gender)
         VALUES ($1, $2, $3, 'unused', 'Test', 'User', '1990-01-01', 'other') RETURNING id`,
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

// Los barberos son una tabla independiente sin cuenta de usuario: se crean
// directamente, sin pasar por 'users'.
const insertBarber = async (shopId: string, bio: string, isAcceptingBookings: boolean) => {
    const shift = await getPool().query(`SELECT id FROM shifts WHERE name = 'morning'`);
    const result = await getPool().query(
        `INSERT INTO barbers (email, first_name, last_name, shop_id, shift_id, bio, is_accepting_bookings, birth_date, gender)
         VALUES ($1, 'Test', 'Barber', $2, $3, $4, $5, '1990-01-01', 'other') RETURNING id`,
        [generateUniqueEmail(), shopId, shift.rows[0].id, bio, isAcceptingBookings]
    );
    const id = result.rows[0].id;
    createdBarberIds.push(id);
    return { id };
};

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    if (createdBarberIds.length > 0) {
        await getPool().query('DELETE FROM barbers WHERE id = ANY($1)', [createdBarberIds]);
    }
    if (createdShopIds.length > 0) {
        await getPool().query('DELETE FROM shops WHERE id = ANY($1)', [createdShopIds]);
    }
    if (createdManagerIds.length > 0) {
        await getPool().query('DELETE FROM users WHERE id = ANY($1)', [createdManagerIds]);
    }
    if (createdOtherUserIds.length > 0) {
        await getPool().query('DELETE FROM users WHERE id = ANY($1)', [createdOtherUserIds]);
    }
    await closeDB();
});

describe('Pruebas de PUT /api/barbers', () => {
    test('debe devolver 200 y el perfil actualizado cuando un manager actualiza a un barbero', async () => {
        const manager = await insertManager();
        const shopId = await insertShop(manager.id);
        const barber = await insertBarber(shopId, 'Old bio', true);
        const token = mintToken(manager.id, 'manager', manager.email);

        const response = await request(app)
            .put('/api/barbers')
            .set('Authorization', `Bearer ${token}`)
            .send({ barber: { id: barber.id, bio: 'New bio', isAcceptingBookings: false } });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchObject({
            id: barber.id,
            shopId,
            bio: 'New bio',
            isAcceptingBookings: false
        });
    });

    test('debe devolver 403 cuando un cliente intenta actualizar el perfil de un barbero', async () => {
        const manager = await insertManager();
        const shopId = await insertShop(manager.id);
        const barber = await insertBarber(shopId, 'Bio', true);
        const client = await insertUser('client');
        createdOtherUserIds.push(client.id);
        const token = mintToken(client.id, 'client', client.email);

        const response = await request(app)
            .put('/api/barbers')
            .set('Authorization', `Bearer ${token}`)
            .send({ barber: { id: barber.id, bio: 'Intruso' } });

        expect(response.statusCode).toBe(403);
    });

    test('debe devolver 404 cuando el barbero objetivo no existe', async () => {
        const manager = await insertManager();
        const token = mintToken(manager.id, 'manager', manager.email);

        const response = await request(app)
            .put('/api/barbers')
            .set('Authorization', `Bearer ${token}`)
            .send({ barber: { id: '00000000-0000-0000-0000-000000000000', bio: 'Nadie' } });

        expect(response.statusCode).toBe(404);
    });
});

describe('Pruebas de DELETE /api/barbers/:id', () => {
    test('debe devolver 200 y dar de baja lógicamente al barbero cuando un manager lo elimina', async () => {
        const manager = await insertManager();
        const shopId = await insertShop(manager.id);
        const barber = await insertBarber(shopId, 'Bio', true);
        const token = mintToken(manager.id, 'manager', manager.email);

        const response = await request(app)
            .delete(`/api/barbers/${barber.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        const dbCheck = await getPool().query('SELECT deleted_at FROM barbers WHERE id = $1', [barber.id]);
        expect(dbCheck.rows[0].deleted_at).not.toBeNull();
    });

    test('debe devolver 403 cuando un cliente intenta eliminar a un barbero', async () => {
        const manager = await insertManager();
        const shopId = await insertShop(manager.id);
        const barber = await insertBarber(shopId, 'Bio', true);
        const client = await insertUser('client');
        createdOtherUserIds.push(client.id);
        const token = mintToken(client.id, 'client', client.email);

        const response = await request(app)
            .delete(`/api/barbers/${barber.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(403);

        const dbCheck = await getPool().query('SELECT deleted_at FROM barbers WHERE id = $1', [barber.id]);
        expect(dbCheck.rows[0].deleted_at).toBeNull();
    });

    test('debe devolver 404 cuando el barbero objetivo no existe', async () => {
        const manager = await insertManager();
        const token = mintToken(manager.id, 'manager', manager.email);

        const response = await request(app)
            .delete('/api/barbers/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
    });
});
