import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

/*
 * Pruebas de integración de /api/haircuts (Supertest contra la base de datos real).
 * S3 se reemplaza por un mock: solo se verifica que el renombrado pida mover la foto.
 */

const moveHaircutPhoto = jest.fn<(oldName: string, newName: string) => Promise<void>>();

jest.unstable_mockModule('../src/services/bucketService.js', () => ({
    moveHaircutPhoto,
    generatePresignedURL: jest.fn(),
    generateHaircutImageURL: jest.fn(),
}));

const { default: router } = await import('../src/routes/routes.js');
const { default: connection } = await import('../src/connection/connection.js');
const { insertManager, insertUser, cleanupFixtures, generateUniqueFixtureName } =
    await import('./helpers/availabilityFixtures.js');
const { signToken } = await import('../src/services/jwtTokenService.js');

import type { User, UserRole } from '../src/types/entities/user.interface.js';

const { connectDB, closeDB, getPool } = connection;

const app = express();
app.use(express.json());
app.use('/api', router);

const mintToken = (id: string, role: UserRole, email: string): string => signToken({ id, role, email } as User);

describe('Estilos de corte (/api/haircuts)', () => {
    let managerToken: string;
    let clientToken: string;
    let receptionistToken: string;

    const createdStyleIds: string[] = [];

    const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

    const createStyle = async (body: Record<string, unknown>) => {
        const res = await request(app).post('/api/haircuts').set(auth(managerToken)).send(body);
        if (res.status === 201) createdStyleIds.push(res.body.data.id);
        return res;
    };

    beforeAll(async () => {
        await connectDB();

        const manager = await insertManager();
        const client = await insertUser('client');
        const receptionist = await insertUser('receptionist');

        managerToken = mintToken(manager.id, 'manager', manager.email);
        clientToken = mintToken(client.id, 'client', client.email);
        receptionistToken = mintToken(receptionist.id, 'receptionist', receptionist.email);
    });

    beforeEach(() => {
        moveHaircutPhoto.mockReset();
        moveHaircutPhoto.mockResolvedValue();
    });

    afterAll(async () => {
        if (createdStyleIds.length > 0) {
            await getPool().query('DELETE FROM haircut_styles WHERE id = ANY($1)', [createdStyleIds]);
        }
        await cleanupFixtures();
        await closeDB();
    });

    describe('POST /api/haircuts', () => {
        test('registra un estilo activo con sus estructuras faciales', async () => {
            const name = generateUniqueFixtureName('Estilo');
            const res = await createStyle({
                name,
                description: 'Descripción de prueba',
                facialStructures: ['square', 'oval'],
            });

            expect(res.status).toBe(201);
            expect(res.body.data).toMatchObject({
                name,
                description: 'Descripción de prueba',
                isActive: true,
                // Se devuelven en el orden del enum
                facialStructures: ['oval', 'square'],
            });
        });

        test('la descripción es opcional', async () => {
            const res = await createStyle({ name: generateUniqueFixtureName('SinDesc'), facialStructures: ['heart'] });

            expect(res.status).toBe(201);
            expect(res.body.data.description).toBeNull();
        });

        test.each([
            ['falta el nombre', { facialStructures: ['oval'] }],
            ['el nombre está vacío', { name: '   ', facialStructures: ['oval'] }],
            ['faltan las estructuras', { name: 'Sin estructuras' }],
            ['las estructuras están vacías', { name: 'Vacías', facialStructures: [] }],
            ['una estructura no existe', { name: 'Inválida', facialStructures: ['hexagon'] }],
            ['hay estructuras repetidas', { name: 'Repetidas', facialStructures: ['oval', 'oval'] }],
        ])('responde 400 cuando %s', async (_label, body) => {
            const res = await createStyle(body);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Validation error');
        });

        test('responde 409 si el nombre coincide con otro estilo (sin importar mayúsculas ni signos)', async () => {
            const base = generateUniqueFixtureName('Duplicado');
            await createStyle({ name: base, facialStructures: ['oval'] });

            const res = await createStyle({ name: base.toUpperCase().replace(/ /g, '-'), facialStructures: ['round'] });

            expect(res.status).toBe(409);
            expect(res.body.message).toBe('Haircut style name is already in use');
        });

        test.each([
            ['cliente', () => clientToken],
            ['recepcionista', () => receptionistToken],
        ])('responde 403 para un %s', async (_label, token) => {
            const res = await request(app)
                .post('/api/haircuts')
                .set(auth(token()))
                .send({ name: generateUniqueFixtureName('NoAuth'), facialStructures: ['oval'] });

            expect(res.status).toBe(403);
        });

        test('responde 401 sin token', async () => {
            const res = await request(app)
                .post('/api/haircuts')
                .send({ name: 'x', facialStructures: ['oval'] });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/haircuts', () => {
        let activeId: string;
        let inactiveId: string;
        const marker = generateUniqueFixtureName('Buscable').split(' ')[1]!;

        beforeAll(async () => {
            activeId = (await createStyle({ name: `Activo ${marker}`, facialStructures: ['oval'] })).body.data.id;
            inactiveId = (
                await createStyle({ name: 'Otro inactivo', description: `desc ${marker}`, facialStructures: ['round'] })
            ).body.data.id;
            await request(app).delete(`/api/haircuts/${inactiveId}`).set(auth(managerToken));
        });

        test('lista activos e inactivos para el manager', async () => {
            const res = await request(app).get('/api/haircuts').set(auth(managerToken));

            expect(res.status).toBe(200);
            const ids = res.body.data.map((style: { id: string }) => style.id);
            expect(ids).toEqual(expect.arrayContaining([activeId, inactiveId]));
        });

        test('busca por nombre o descripción sin distinguir mayúsculas', async () => {
            const res = await request(app)
                .get('/api/haircuts')
                .query({ search: marker.toUpperCase() })
                .set(auth(managerToken));

            expect(res.status).toBe(200);
            expect(res.body.data.map((style: { id: string }) => style.id).sort()).toEqual(
                [activeId, inactiveId].sort()
            );
        });

        test('filtra por estado', async () => {
            const res = await request(app)
                .get('/api/haircuts')
                .query({ search: marker, status: 'inactive' })
                .set(auth(managerToken));

            expect(res.body.data.map((style: { id: string }) => style.id)).toEqual([inactiveId]);
        });

        test('devuelve un arreglo vacío si nada coincide', async () => {
            const res = await request(app)
                .get('/api/haircuts')
                .query({ search: 'zzz-sin-coincidencias-zzz' })
                .set(auth(managerToken));

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });

        test('responde 400 con un estado inválido', async () => {
            const res = await request(app).get('/api/haircuts').query({ status: 'all' }).set(auth(managerToken));

            expect(res.status).toBe(400);
        });

        test('responde 403 para un cliente', async () => {
            const res = await request(app).get('/api/haircuts').set(auth(clientToken));

            expect(res.status).toBe(403);
        });

        test('GET /api/haircuts/:id devuelve el estilo', async () => {
            const res = await request(app).get(`/api/haircuts/${activeId}`).set(auth(managerToken));

            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({ id: activeId, facialStructures: ['oval'] });
        });

        test('GET /api/haircuts/:id responde 404 si no existe y 400 si el id es inválido', async () => {
            const missing = await request(app)
                .get('/api/haircuts/00000000-0000-4000-8000-000000000000')
                .set(auth(managerToken));
            const invalid = await request(app).get('/api/haircuts/not-a-uuid').set(auth(managerToken));

            expect(missing.status).toBe(404);
            expect(invalid.status).toBe(400);
        });
    });

    describe('GET /api/haircuts/facial-structures', () => {
        test('devuelve los valores del enum de la base de datos', async () => {
            const res = await request(app).get('/api/haircuts/facial-structures').set(auth(managerToken));

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(['oval', 'triangle', 'heart', 'round', 'diamond', 'square', 'rectangle']);
        });
    });

    describe('PUT /api/haircuts/:id', () => {
        let styleId: string;
        let styleName: string;

        beforeEach(async () => {
            styleName = generateUniqueFixtureName('Editable');
            styleId = (await createStyle({ name: styleName, facialStructures: ['oval', 'round'] })).body.data.id;
        });

        test('actualiza los campos y reemplaza las estructuras faciales', async () => {
            const res = await request(app)
                .put(`/api/haircuts/${styleId}`)
                .set(auth(managerToken))
                .send({ description: 'Actualizada', facialStructures: ['diamond'], isActive: false });

            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({
                name: styleName,
                description: 'Actualizada',
                facialStructures: ['diamond'],
                isActive: false,
            });
            expect(moveHaircutPhoto).not.toHaveBeenCalled();
        });

        test('al renombrar mueve la foto', async () => {
            const newName = generateUniqueFixtureName('Renombrado');
            const res = await request(app)
                .put(`/api/haircuts/${styleId}`)
                .set(auth(managerToken))
                .send({ name: newName });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe(newName);
            expect(moveHaircutPhoto).toHaveBeenCalledWith(styleName, newName);
        });

        test('si mover la foto falla, no se guarda el cambio', async () => {
            moveHaircutPhoto.mockRejectedValue(new Error('S3 unavailable'));

            const res = await request(app)
                .put(`/api/haircuts/${styleId}`)
                .set(auth(managerToken))
                .send({ name: generateUniqueFixtureName('Fallido'), facialStructures: ['heart'] });

            expect(res.status).toBe(500);
            const stored = await request(app).get(`/api/haircuts/${styleId}`).set(auth(managerToken));
            expect(stored.body.data).toMatchObject({ name: styleName, facialStructures: ['oval', 'round'] });
        });

        test('responde 409 si el nombre pertenece a otro estilo', async () => {
            const other = generateUniqueFixtureName('Ocupado');
            await createStyle({ name: other, facialStructures: ['oval'] });

            const res = await request(app)
                .put(`/api/haircuts/${styleId}`)
                .set(auth(managerToken))
                .send({ name: other.toLowerCase() });

            expect(res.status).toBe(409);
        });

        test('responde 400 con el cuerpo vacío o estructuras vacías', async () => {
            const empty = await request(app).put(`/api/haircuts/${styleId}`).set(auth(managerToken)).send({});
            const noStructures = await request(app)
                .put(`/api/haircuts/${styleId}`)
                .set(auth(managerToken))
                .send({ facialStructures: [] });

            expect(empty.status).toBe(400);
            expect(noStructures.status).toBe(400);
        });

        test('responde 404 si el estilo no existe', async () => {
            const res = await request(app)
                .put('/api/haircuts/00000000-0000-4000-8000-000000000000')
                .set(auth(managerToken))
                .send({ isActive: true });

            expect(res.status).toBe(404);
        });

        test('responde 403 para una recepcionista', async () => {
            const res = await request(app)
                .put(`/api/haircuts/${styleId}`)
                .set(auth(receptionistToken))
                .send({ isActive: false });

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/haircuts/:id', () => {
        test('da de baja el estilo sin borrar la fila y es idempotente', async () => {
            const styleId = (await createStyle({ name: generateUniqueFixtureName('Baja'), facialStructures: ['oval'] }))
                .body.data.id;

            const first = await request(app).delete(`/api/haircuts/${styleId}`).set(auth(managerToken));
            const second = await request(app).delete(`/api/haircuts/${styleId}`).set(auth(managerToken));

            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            const row = await getPool().query('SELECT is_active FROM haircut_styles WHERE id = $1', [styleId]);
            expect(row.rows[0].is_active).toBe(false);
        });

        test('responde 404 si el estilo no existe', async () => {
            const res = await request(app)
                .delete('/api/haircuts/00000000-0000-4000-8000-000000000000')
                .set(auth(managerToken));

            expect(res.status).toBe(404);
        });

        test('responde 403 para un cliente', async () => {
            const res = await request(app)
                .delete('/api/haircuts/00000000-0000-4000-8000-000000000000')
                .set(auth(clientToken));

            expect(res.status).toBe(403);
        });
    });
});
