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

/* Prueba 1 - Tests*/
describe('Pruebas de los Endpoints de Tests', () => {
    test('POST /api/crearTest debe devolver status 201', async () => {
        const test = {
            id_test: 'T0001',
            field_test: 'Test 1'
        }
        /* Con superstest el body se manda dentro del .send */
        const response = await request(app).post('/api/crearTest').send(test);
        console.log(response.body);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('Test creado');
    });

    test('GET /api/listarTests debe devolver status 200', async () => {
        const response = await request(app).get('/api/listarTests');
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('PUT /api/actualizarTest debe devolver status 200', async () => {
        const test = {
            id_test: 'T0001',
            field_test: 'Test editado'
        }
        const response = await request(app).put('/api/actualizarTest').send(test);
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('Test actualizado');
    });

    test('DELETE /api/eliminarTest debe devolver status 200', async () => {
        const test = {
            id_test: 'T0001'
        }
        const response = await request(app).delete('/api/eliminarTest').send(test);
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('Test eliminado');
    });
});


