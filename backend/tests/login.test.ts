import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';

const { connectDB, closeDB, getPool } = connection;

/* Montamos otro express exclusivo para pruebas */
const app = express();
app.use(express.json());
app.use('/api', router);

/* Correos creados por las pruebas, para poder limpiarlos al finalizar */
const createdEmails: string[] = [];

// Contador para garantizar valores únicos incluso si dos llamadas caen en el mismo milisegundo
let uniqueCounter = 0;
const generateUniqueEmail = () => {
    uniqueCounter += 1;
    return `test_${Date.now()}_${uniqueCounter}@mrbarber.com`;
};
// La columna phone es varchar(10) UNIQUE, así que también debe ser única por prueba
const generateUniquePhone = () => {
    uniqueCounter += 1;
    return `${Date.now()}${uniqueCounter}`.slice(-10);
};

/* Abrir conexión a la base de datos antes de todas las pruebas */
beforeAll(async () => {
    await connectDB();
});

/* Borramos los usuarios creados por las pruebas y cerramos la conexión al terminar */
afterAll(async () => {
    if (createdEmails.length > 0) {
        await getPool().query('DELETE FROM users WHERE email = ANY($1)', [createdEmails]);
    }
    await closeDB();
});

/* Pruebas de los Endpoints de Autenticación */
describe('Pruebas de los Endpoints de Auth', () => {
    const baseAuthUrl = '/api/auth';

    // Generamos un correo y teléfono únicos para que la prueba no truene por duplicados al correrla varias veces
    const uniqueEmail = generateUniqueEmail();
    const uniquePhone = generateUniquePhone();
    const testPassword = 'password123';

    /* Prueba 1: Zod en el controlador */
    test('POST /api/register debe devolver status 400 si faltan datos obligatorios', async () => {
        const invalidUser = {
            email: 'solo_correo@mrbarber.com'
            // Faltan campos obligatorios como name, lastname, password
        };
        
        const response = await request(app).post(`${baseAuthUrl}/register`).send(invalidUser);

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(Array.isArray(response.body.error)).toBe(true);
    });

    /* Prueba 2: Creación exitosa */
    test('POST /api/register debe devolver status 201 al registrar un cliente correctamente', async () => {
        const newUser = {
            name: 'Test',
            lastname: 'User',
            phone: uniquePhone,
            email: uniqueEmail,
            password: testPassword
        };
        createdEmails.push(uniqueEmail);

        const response = await request(app).post(`${baseAuthUrl}/register`).send(newUser);

        expect(response.statusCode).toBe(201);
        expect(response.body.data).toHaveProperty('token'); // Verificamos que devuelva el token de auto-login
        expect(response.body.data.user.email).toBe(uniqueEmail);
        expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    /* Prueba 3: Restricción de base de datos.
       Es independiente de la Prueba 2: crea su propio usuario primero, así que no
       depende de que otra prueba haya corrido (ni de su orden) para tener sentido. */
    test('POST /api/register debe devolver status 409 si el correo ya está registrado', async () => {
        const duplicateEmail = generateUniqueEmail();
        const duplicateUser = {
            name: 'Test',
            lastname: 'User',
            phone: generateUniquePhone(),
            email: duplicateEmail,
            password: testPassword
        };
        createdEmails.push(duplicateEmail);

        // Registramos el usuario una primera vez para garantizar que el correo ya exista
        const setupResponse = await request(app).post(`${baseAuthUrl}/register`).send(duplicateUser);
        expect(setupResponse.statusCode).toBe(201);

        // Intentamos registrarlo de nuevo con el mismo correo
        const response = await request(app).post(`${baseAuthUrl}/register`).send(duplicateUser);

        expect(response.statusCode).toBe(409);
        expect(response.body.message).toBe('Email is already registered');
    });

    /* Prueba 4: Login correcto */
    test('POST /api/login debe devolver status 200 y el token si las credenciales son correctas', async () => {
        const credentials = {
            email: uniqueEmail,
            password: testPassword
        };

        const response = await request(app).post(`${baseAuthUrl}/login`).send(credentials);

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data.user.email).toBe(uniqueEmail);
        expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    /* Prueba 5: Login incorrecto */
    test('POST /api/login debe devolver status 404 si la contraseña es incorrecta', async () => {
        const wrongCredentials = {
            email: uniqueEmail,
            password: 'clave_equivocada_123'
        };

        const response = await request(app).post(`${baseAuthUrl}/login`).send(wrongCredentials);
        
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('User not found or invalid credentials');
    });

    /* Prueba 6: Login con correo inexistente */
    test('POST /api/login debe devolver status 404 y code NOT_FOUND si el usuario no existe', async () => {
        const response = await request(app)
            .post(`${baseAuthUrl}/login`)
            .send({ email: generateUniqueEmail(), password: testPassword });

        expect(response.statusCode).toBe(404);
    });
});