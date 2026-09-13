/* Para hacer pruebas de las peticiones */
import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import { sendFail } from '../src/utils/apiResponse.js';

const { connectDB, closeDB } = connection;

/* Montamos otro express exclusivo para pruebas */
const app = express();
app.use(express.json());

app.use('/api', router);

app.use('/api', (req,res)=> 
    sendFail(res, 'Ruta de la API no encontrada', 
        ['Ruta de la API no encontrada'], 404));
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

    // prueba de crear un test
    test('POST /api/crearTest debe devolver status 201', async () => {
        const test = {
            id_test: 'T0001',
            field_test: 'Test 1',
        };
        const response = await request(app).post('/api/crearTest').send(test);
       
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({
            data: expect.any(Number),
            message: expect.any(String),
            error: null,
        });
        
    });

    test('GET /api/listarTests debe devolver status 200', async () => {
        const response = await request(app).get('/api/listarTests');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            data: expect.any(Array),
            message: expect.any(String),
            error: null,
        });
    });
    
    test('GET /api/rutaInexistente debe devolver error 404', async () => {
         const response = await request(app) .get('/api/rutaInexistente'); 
         expect(response.statusCode).toBe(404); 
         expect(response.body).toEqual({ 
            data: null, 
            message: 'Ruta de la API no encontrada', 
            error: ['Ruta de la API no encontrada'], }); 
});

    test('PUT /api/actualizarTest debe devolver envelope con los datos actualizados', async () => {
        const test = {
            id_test: 'T0001',
            field_test: 'Test editado',
        };
        const response = await request(app).put('/api/actualizarTest').send(test);

       expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            data: { id_test: 'T0001', field_test: 'Test editado' },
            message: expect.any(String),
            error: null,
        });
    });
     test('PUT /api/actualizarTest debe devolver error', async () => {
        const response = await request(app)
            .put('/api/actualizarTest')
            .send({ id_test: 'T9999', field_test: 'x' });
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({
            data: null,
            message: expect.any(String),
            error: expect.arrayContaining([expect.any(String)]),
        });
    });

    test('DELETE /api/eliminarTest debe devolver envelope con número de filas', async () => {
        const test = {
            id_test: 'T0001',
        };
        const response = await request(app).delete('/api/eliminarTest').send(test);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            data: expect.any(Number),
            message: expect.any(String),
            error: null,
        });
    });

    test('DELETE /api/eliminarTest debe devolver error', async () => {
        const response = await request(app)
            .delete('/api/eliminarTest')
            .send({ id_test: 'T9999' });
      
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({
            data: null,
            message: expect.any(String),
            error: expect.arrayContaining([expect.any(String)]),
        });
    });
});
