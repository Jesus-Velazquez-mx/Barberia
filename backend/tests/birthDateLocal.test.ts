import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { generateUniqueEmail, generateUniquePhone } from './helpers/uniqueValues.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const createdEmails: string[] = [];
const originalTZ = process.env.TZ;

/* Fechas elegidas para que cualquier conversión a/desde un instante UTC cambie el día:
   - 1 de enero / 31 de diciembre: el corrimiento también cambiaría el año.
   - 29 de febrero: el corrimiento caería en un día inexistente en años no bisiestos. */
const BIRTH_DATES = ['1990-01-01', '1999-12-31', '2000-02-29', '2004-10-01'];
const TIMEZONES = ['UTC', 'America/Mexico_City', 'America/Los_Angeles', 'Pacific/Auckland'];

const register = async (birthDate: string) => {
    const email = generateUniqueEmail();
    createdEmails.push(email);
    const response = await request(app).post('/api/auth/register').send({
        firstName: 'Test',
        lastName: 'User',
        phone: generateUniquePhone(),
        email,
        password: 'password123',
        birthDate,
        gender: 'other',
    });
    return { email, response };
};

/* La fecha tal como quedó guardada, leída como texto para evitar cualquier conversión de Date */
const storedBirthDate = async (email: string): Promise<string> => {
    const result = await getPool().query('SELECT birth_date::text AS birth_date FROM users WHERE email = $1', [email]);
    return result.rows[0].birth_date;
};

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    if (createdEmails.length > 0) {
        await getPool().query('DELETE FROM users WHERE email = ANY($1)', [createdEmails]);
    }
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
    await closeDB();
});

describe('birthDate se trata como fecha local (sin hora ni zona)', () => {
    describe.each(TIMEZONES)('con TZ=%s', (tz) => {
        beforeEach(() => {
            process.env.TZ = tz;
        });

        test.each(BIRTH_DATES)('registro con %s: se guarda y se responde el mismo día', async (birthDate) => {
            const { email, response } = await register(birthDate);

            expect(response.statusCode).toBe(201);
            // La respuesta es exactamente 'YYYY-MM-DD', no un datetime ISO
            expect(response.body.data.user.birthDate).toBe(birthDate);
            expect(await storedBirthDate(email)).toBe(birthDate);
        });

        test.each(BIRTH_DATES)('login devuelve el mismo día que se registró (%s)', async (birthDate) => {
            const { email } = await register(birthDate);

            const login = await request(app).post('/api/auth/login').send({ email, password: 'password123' });

            expect(login.statusCode).toBe(200);
            expect(login.body.data.user.birthDate).toBe(birthDate);
        });
    });

    test('actualizar birthDate vía PUT /api/users conserva el día exacto', async () => {
        const { email, response: registered } = await register('1990-01-01');
        const { id } = registered.body.data.user;
        const token = registered.body.data.token as string;

        for (const tz of TIMEZONES) {
            process.env.TZ = tz;
            const newDate = '2001-03-01'; // el día 1 es el más propenso a caer en el mes anterior si se desplaza

            const response = await request(app)
                .put('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send({ user: { id, birthDate: newDate } });

            expect(response.statusCode).toBe(200);
            expect(response.body.data.birthDate).toBe(newDate);
            expect(await storedBirthDate(email)).toBe(newDate);

            // Se restaura un valor distinto para que la siguiente zona vuelva a hacer una escritura real
            await getPool().query(`UPDATE users SET birth_date = '1990-01-01' WHERE email = $1`, [email]);
        }
    });

    test('un datetime sin zona (cliente Android antiguo) se guarda como el mismo día, sin desplazarse', async () => {
        for (const tz of TIMEZONES) {
            process.env.TZ = tz;
            const { email, response } = await register('2004-10-01T12:00:00');

            expect(response.statusCode).toBe(201);
            expect(response.body.data.user.birthDate).toBe('2004-10-01');
            expect(await storedBirthDate(email)).toBe('2004-10-01');
        }
    });

    test('un instante UTC (con Z) se rechaza con 400 en lugar de adivinar el día', async () => {
        const { email, response } = await register('1990-01-01T00:00:00.000Z');

        expect(response.statusCode).toBe(400);
        const rows = await getPool().query('SELECT 1 FROM users WHERE email = $1', [email]);
        expect(rows.rowCount).toBe(0);
    });

    test('una fecha de calendario inexistente se rechaza con 400', async () => {
        const { response } = await register('1999-02-29');

        expect(response.statusCode).toBe(400);
    });
});
