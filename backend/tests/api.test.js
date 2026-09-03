/* Para hacer pruebas de las peticiones */
import request from 'supertest';
import express from 'express';
import router from '../routes/routes.js';
import connection from '../connection/connection.js';

const { connectDB, closeDB } = connection;

/* Montamos otro express exclusivo para pruebas */
const app = express();
app.use(express.json());
app.use('/api', router);
/* Abrir conexión */
beforeAll(async () => {
    await connectDB();
});
/* Cerrar conexión*/
afterAll(async () => {
    await closeDB();
});

/* Prueba 1 - Usuarios*/
describe('Pruebas de los Endpoints de Usuarios', () => {
    test('GET /api/listarUsuarios debe devolver status 200', async () => {
        const response = await request(app).get('/api/listarUsuarios');
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('POST /api/crearUsuario debe devolver status 201', async () => {
        const userTest = {
            first_name: 'Juan',
            last_name: 'Pérez',
            birthdate: '1990-01-01'
        }
        /* Con superstest el body se manda dentro del .send */
        const response = await request(app).post('/api/crearUsuario').send(userTest);
        console.log(response.body);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('Usuario creado');
    });

    test('PUT /api/actualizarUsuario debe devolver status 200', async () => {
        const userTest = {
            id: 2,
            first_name: 'Joel',
            last_name: 'Pérez',
            birthdate: '1990-01-01'
        }
        const response = await request(app).put('/api/actualizarUsuario').send(userTest);
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('Usuario actualizado');
    });

    test('DELETE /api/eliminarUsuario debe devolver status 200', async () => {
        const userTest = {
            id: 3,
        }
        const response = await request(app).delete('/api/eliminarUsuario').send(userTest);
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('Usuario eliminado');
    });
});


