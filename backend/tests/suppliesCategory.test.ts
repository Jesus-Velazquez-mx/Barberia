import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';
import {
    insertManager,
    insertUser,
    cleanupFixtures,
    generateUniqueFixtureName,
} from './helpers/availabilityFixtures.js';
import { signToken } from '../src/services/jwtTokenService.js';
import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

// Configuración de la app de Express para pruebas
const app = express();
app.use(express.json());
app.use('/api', router);

// Función para generar un JWT válido para las pruebas
const mintToken = (id: string, role: UserRole, email: string): string =>
    signToken({ id, role, email } as User);

// Helper local para insertar categorías de prueba en la BD
const insertCategory = async (name: string, description: string | null = null): Promise<string> => {
    const pool = getPool();
    const res = await pool.query(
        `INSERT INTO supplies_categories (name, description) VALUES ($1, $2) RETURNING id`,
        [name, description]
    );
    return res.rows[0].id;
};

describe('Pruebas de endpoints de Categorías de Insumos (Supplies Categories)', () => {
    let dummyManager: { id: string; email: string };
    let clientUser: { id: string; email: string };
    let managerToken: string;
    let clientToken: string;

    let categoryId1: string;
    let categoryId2: string;

    // Arreglo para guardar IDs creados en las pruebas y borrarlos al final
    const createdCategoryIds: string[] = [];

    beforeAll(async () => {
        await connectDB();

        // 1. Crear manager y cliente con sus tokens usando los helpers existentes
        dummyManager = await insertManager();
        clientUser = await insertUser('client');

        managerToken = mintToken(dummyManager.id, 'manager', dummyManager.email);
        clientToken = mintToken(clientUser.id, 'client', clientUser.email);

        // 2. Insertar categorías base para probar los GET
        categoryId1 = await insertCategory('A_Test Category', 'Descripción A');
        categoryId2 = await insertCategory('Z_Test Category', 'Descripción Z');
        createdCategoryIds.push(categoryId1, categoryId2);
    });

    afterAll(async () => {
        const pool = getPool();
        // Limpiar todas las categorías creadas en este bloque de pruebas
        if (createdCategoryIds.length > 0) {
            await pool.query('DELETE FROM supplies_categories WHERE id = ANY($1)', [createdCategoryIds]);
        }
        await cleanupFixtures(); // Limpia los usuarios/managers creados
        await closeDB();
    });

    describe('Listar Categorías (GET /api/suppliesCategories)', () => {
        test('Debe responder 200 y una lista de categorías (MANAGER)', async () => {
            const res = await request(app)
                .get('/api/suppliesCategories')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            // Verificar que al menos nuestras 2 categorías insertadas existan en la respuesta
            const cat1 = res.body.data.find((c: any) => c.id === categoryId1);
            expect(cat1).toBeDefined();
            expect(cat1.name).toBe('A_Test Category');

            const cat2 = res.body.data.find((c: any) => c.id === categoryId2);
            expect(cat2).toBeDefined();
        });

        test('Debe responder 403 si un CLIENTE intenta listar las categorías', async () => {
            const res = await request(app)
                .get('/api/suppliesCategories')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
        });

        test('Debe responder 401 si no se envía token de autorización', async () => {
            const res = await request(app).get('/api/suppliesCategories');
            expect(res.status).toBe(401);
        });
    });

    describe('Obtener Categoría por ID (GET /api/suppliesCategories/:id)', () => {
        test('Debe responder 200 y los detalles de la categoría existente (MANAGER)', async () => {
            const res = await request(app)
                .get(`/api/suppliesCategories/${categoryId1}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(categoryId1);
            expect(res.body.data.name).toBe('A_Test Category');
            expect(res.body.data.description).toBe('Descripción A');
        });

        test('Debe responder 403 si un CLIENTE intenta obtener la categoría', async () => {
            const res = await request(app)
                .get(`/api/suppliesCategories/${categoryId1}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
        });

        test('Debe responder 401 si no se envía token de autorización', async () => {
            const res = await request(app).get(`/api/suppliesCategories/${categoryId1}`);
            expect(res.status).toBe(401);
        });

        test('Debe responder 404 para un UUID que no existe (MANAGER)', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .get(`/api/suppliesCategories/${fakeUuid}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/not found/i);
        });

        test('Debe responder 400 Validation Error para un UUID mal formado (MANAGER)', async () => {
            const badUuid = 'not-a-uuid';
            const res = await request(app)
                .get(`/api/suppliesCategories/${badUuid}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error[0].detail).toMatch(/Invalid category ID format/i);
        });
    });

    describe('Crear Categoría (POST /api/suppliesCategories)', () => {
        test('Debe responder 201 y crear una nueva categoría con token de manager', async () => {
            const newCategoryData = {
                name: generateUniqueFixtureName('CatCreate'),
                description: 'Categoría de prueba POST',
            };

            const res = await request(app)
                .post('/api/suppliesCategories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(newCategoryData);

            expect(res.status).toBe(201);
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.name).toBe(newCategoryData.name);
            expect(res.body.data.description).toBe(newCategoryData.description);
            
            // Guardamos el ID para borrarlo en el afterAll
            createdCategoryIds.push(res.body.data.id); 
        });

        test('Debe responder 401 si no se envía token de autorización', async () => {
            const res = await request(app)
                .post('/api/suppliesCategories')
                .send({ name: 'Sin Token' });

            expect(res.status).toBe(401);
        });

        test('Debe responder 403 si un cliente intenta crear una categoría', async () => {
            const res = await request(app)
                .post('/api/suppliesCategories')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ name: 'Cliente No Puede' });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized/i);
        });

        test('Debe responder 409 si el nombre de la categoría ya existe', async () => {
            const res = await request(app)
                .post('/api/suppliesCategories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: 'A_Test Category' }); // Ya fue creada en el beforeAll

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/already in use/i);
        });

        test('Debe responder 400 si falta el nombre (campo obligatorio)', async () => {
            const res = await request(app)
                .post('/api/suppliesCategories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ description: 'Solo envié descripción' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined(); 
        });
    });

    describe('Editar Categoría (PUT /api/suppliesCategories/:id)', () => {
        let categoryToEditId: string;

        beforeAll(async () => {
            categoryToEditId = await insertCategory(generateUniqueFixtureName('CatEdit'));
            createdCategoryIds.push(categoryToEditId);
        });

        test('Debe responder 200 y actualizar los campos con éxito', async () => {
            const updatedFields = {
                name: generateUniqueFixtureName('CatEdited'),
                description: 'Descripción actualizada',
            };

            const res = await request(app)
                .put(`/api/suppliesCategories/${categoryToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send(updatedFields);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(categoryToEditId);
            expect(res.body.data.name).toBe(updatedFields.name);
            expect(res.body.data.description).toBe(updatedFields.description);
        });

        test('Debe responder 403 si un cliente intenta actualizar', async () => {
            const res = await request(app)
                .put(`/api/suppliesCategories/${categoryToEditId}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ name: 'Hacker' });

            expect(res.status).toBe(403);
        });

        test('Debe responder 404 si la categoría a editar no existe', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .put(`/api/suppliesCategories/${fakeUuid}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: 'Nuevo Nombre' });

            expect(res.status).toBe(404);
        });

        test('Debe responder 409 si se intenta cambiar el nombre por uno que ya tiene otra categoría', async () => {
            const res = await request(app)
                .put(`/api/suppliesCategories/${categoryToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: 'A_Test Category' }); // Nombre existente

            expect(res.status).toBe(409);
        });

        test('Debe responder 400 si el cuerpo de actualización está vacío', async () => {
            const res = await request(app)
                .put(`/api/suppliesCategories/${categoryToEditId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('Eliminar Categoría (DELETE /api/suppliesCategories/:id)', () => {
        let categoryToDeleteId: string;

        beforeAll(async () => {
            categoryToDeleteId = await insertCategory(generateUniqueFixtureName('CatDel'));
            // No lo agregamos a createdCategoryIds para no causar error en el teardown si se borra aquí con éxito
        });

        test('Debe responder 401 si no hay token', async () => {
            const res = await request(app).delete(`/api/suppliesCategories/${categoryToDeleteId}`);
            expect(res.status).toBe(401);
        });

        test('Debe responder 403 si lo intenta un cliente', async () => {
            const res = await request(app)
                .delete(`/api/suppliesCategories/${categoryToDeleteId}`)
                .set('Authorization', `Bearer ${clientToken}`);
            expect(res.status).toBe(403);
        });

        test('Debe responder 404 si no existe', async () => {
            const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app)
                .delete(`/api/suppliesCategories/${fakeUuid}`)
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(404);
        });

        test('Debe responder 200 y realizar borrado FÍSICO en BD', async () => {
            // 1. Ejecutar el DELETE
            const res = await request(app)
                .delete(`/api/suppliesCategories/${categoryToDeleteId}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/deleted successfully/i);

            // 2. Comprobar en BD que la fila ya NO EXISTE
            const pool = getPool();
            const dbCheck = await pool.query('SELECT id FROM supplies_categories WHERE id = $1', [categoryToDeleteId]);

            expect(dbCheck.rows.length).toBe(0); // Borrado físico
        });
    });
});