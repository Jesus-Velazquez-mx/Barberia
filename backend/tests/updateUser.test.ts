import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { loadConfig } from '../src/config/globalConfig.js';

export const globalConfig = loadConfig();
const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const createdEmails: string[] = [];

let uniqueCounter = 0;
const generateUniqueEmail = () => {
    uniqueCounter += 1;
    return `update_test_${Date.now()}_${uniqueCounter}@mrbarber.com`;
};
const generateUniquePhone = () => {
    uniqueCounter += 1;
    return `${Date.now()}${uniqueCounter}`.slice(-10);
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
    if (createdEmails.length > 0) {
        await getPool().query('DELETE FROM users WHERE email = ANY($1)', [createdEmails]);
    }
    await closeDB();
});

describe('Pruebas de PUT /api/user', () => {
    test('debe devolver 200 y los datos actualizados cuando un cliente se actualiza a sí mismo', async () => {
        const client = await registerClient();
        const newPhone = generateUniquePhone();

        const response = await request(app).put('/api/user').send({
            user: { id: client.id, firstName: 'Actualizado', phone: newPhone },
            token: client.token
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.firstName).toBe('Actualizado');
        expect(response.body.data.phone).toBe(newPhone);
        expect(response.body.data).not.toHaveProperty('password_hash');
    });

    test('debe devolver 401 con un token inválido', async () => {
        const client = await registerClient();

        const response = await request(app).put('/api/user').send({
            user: { id: client.id, firstName: 'Nuevo' },
            token: 'token.invalido.aqui'
        });

        expect(response.statusCode).toBe(400);
    });

    test('debe devolver 403 cuando un cliente intenta actualizar a otro cliente', async () => {
        const clientA = await registerClient();
        const clientB = await registerClient();

        const response = await request(app).put('/api/user').send({
            user: { id: clientB.id, firstName: 'Intruso' },
            token: clientA.token
        });

        expect(response.statusCode).toBe(403);
    });

    test('debe devolver 404 cuando el usuario objetivo no existe', async () => {
        const client = await registerClient();

        const response = await request(app).put('/api/user').send({
            user: { id: '00000000-0000-0000-0000-000000000000', firstName: 'Nadie' },
            token: client.token
        });

        expect(response.statusCode).toBe(404);
    });

    test('debe devolver 409 cuando el correo ya pertenece a otro usuario', async () => {
        const clientA = await registerClient();
        const clientB = await registerClient();

        const response = await request(app).put('/api/user').send({
            user: { id: clientA.id, email: clientB.email },
            token: clientA.token
        });

        expect(response.statusCode).toBe(409);
    });
});
