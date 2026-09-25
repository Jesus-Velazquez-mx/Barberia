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

const createdUserIds: string[] = [];

let uniqueCounter = 0;
const generateUniqueEmail = () => {
    uniqueCounter += 1;
    return `update_manager_test_${Date.now()}_${uniqueCounter}@mrbarber.com`;
};
const generateUniquePhone = () => {
    uniqueCounter += 1;
    return `${Date.now()}${uniqueCounter}`.slice(-10);
};

// Solo se necesitan id/role/email para firmar el token; el resto de campos no
// se usan (ver src/services/jwtTokenService.ts).
const mintToken = (id: string, role: UserRole, email: string): string =>
    signToken({ id, role, email } as User);

const insertUser = async (role: UserRole): Promise<{ id: string; email: string }> => {
    const email = generateUniqueEmail();
    const result = await getPool().query(
        `INSERT INTO users (role, email, phone, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, 'unused', 'Test', 'User') RETURNING id`,
        [role, email, generateUniquePhone()]
    );
    const id = result.rows[0].id;
    createdUserIds.push(id);
    return { id, email };
};

const insertManager = async (title: string) => {
    const user = await insertUser('manager');
    await getPool().query('INSERT INTO managers (user_id, title) VALUES ($1, $2)', [user.id, title]);
    return user;
};

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    if (createdUserIds.length > 0) {
        await getPool().query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
    await closeDB();
});

describe('Pruebas de PUT /api/managers', () => {
    test('debe devolver 200 y el título actualizado cuando un manager se actualiza a sí mismo', async () => {
        const manager = await insertManager('Old Title');
        const token = mintToken(manager.id, 'manager', manager.email);

        const response = await request(app).put('/api/managers').send({
            manager: { id: manager.id, title: 'New Title' },
            token
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toEqual({ userId: manager.id, title: 'New Title' });
    });

    test('debe devolver 403 cuando un manager intenta actualizar el título de otro manager', async () => {
        const managerA = await insertManager('Manager A');
        const managerB = await insertManager('Manager B');
        const token = mintToken(managerA.id, 'manager', managerA.email);

        const response = await request(app).put('/api/managers').send({
            manager: { id: managerB.id, title: 'Intruso' },
            token
        });

        expect(response.statusCode).toBe(403);
    });

    test('debe devolver 403 cuando un cliente intenta actualizar un título de manager', async () => {
        const manager = await insertManager('Manager');
        const client = await insertUser('client');
        const token = mintToken(client.id, 'client', client.email);

        const response = await request(app).put('/api/managers').send({
            manager: { id: manager.id, title: 'Intruso' },
            token
        });

        expect(response.statusCode).toBe(403);
    });

    test('debe devolver 404 cuando el token es de un manager sin fila en managers', async () => {
        // Simula un usuario con role='manager' cuya fila en managers no existe
        // (o ya fue eliminada). Como el chequeo de autorización es self-only,
        // esta es la única forma de llegar a un 404 en este endpoint.
        const orphan = await insertUser('manager');
        const token = mintToken(orphan.id, 'manager', orphan.email);

        const response = await request(app).put('/api/managers').send({
            manager: { id: orphan.id, title: 'Nadie' },
            token
        });

        expect(response.statusCode).toBe(404);
    });
});
