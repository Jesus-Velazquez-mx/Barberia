import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js'; 
import connection from '../src/connection/connection.js';

const { connectDB, closeDB } = connection;

/* Montamos otro express exclusivo para pruebas */
const app = express();
app.use(express.json());
app.use('/api', router);

/* Abrir conexión a la base de datos antes de todas las pruebas */
beforeAll(async () => {
    await connectDB();
});

/* Cerrar conexión al terminar todas las pruebas */
afterAll(async () => {
    await closeDB();
});

/* Pruebas de los Endpoints de Autenticación */
describe('Pruebas de los Endpoints de Auth', () => {
    
    // Generamos un correo único basado en la hora actual para que la prueba no truene por duplicados al correrla varias veces
    const uniqueEmail = `test_${Date.now()}@mrbarber.com`;
    const testPassword = 'password123';

    /* Prueba 1: Zod en el controlador */
    test('POST /api/register debe devolver status 400 si faltan datos obligatorios', async () => {
        const invalidUser = {
            email: 'solo_correo@mrbarber.com'
            // Faltan campos obligatorios como name, lastname, password
        };
        
        const response = await request(app).post('/api/register').send(invalidUser);
        
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('issues');
    });

    /* Prueba 2: Creación exitosa */
    test('POST /api/register debe devolver status 201 al registrar un cliente correctamente', async () => {
        const newUser = {
            name: 'Test',
            lastname: 'User',
            phone: '6671112233',
            email: uniqueEmail,
            password: testPassword
        };

        const response = await request(app).post('/api/register').send(newUser);
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('token'); // Verificamos que devuelva el token de auto-login
        expect(response.body.email).toBe(uniqueEmail);
    });

    /* Prueba 3: Restricción de base de datos */
    test('POST /api/register debe devolver status 409 si el correo ya está registrado', async () => {
        const duplicateUser = {
            name: 'Test',
            lastname: 'User',
            email: uniqueEmail, // Usamos el correo que acabamos de registrar arriba
            password: testPassword
        };

        const response = await request(app).post('/api/register').send(duplicateUser);
        
        expect(response.statusCode).toBe(409);
        expect(response.body.message).toBe('Email is already registered');
    });

    /* Prueba 4: Login correcto */
    test('POST /api/login debe devolver status 200 y el token si las credenciales son correctas', async () => {
        const credentials = {
            email: uniqueEmail,
            password: testPassword
        };

        const response = await request(app).post('/api/login').send(credentials);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    /* Prueba 5: Login incorrecto */
    test('POST /api/login debe devolver status 404 si la contraseña es incorrecta', async () => {
        const wrongCredentials = {
            email: uniqueEmail,
            password: 'clave_equivocada_123'
        };

        const response = await request(app).post('/api/login').send(wrongCredentials);
        
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('User not found or invalid credentials');
    });
});