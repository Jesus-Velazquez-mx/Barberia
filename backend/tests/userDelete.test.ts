import request from 'supertest';
import express from 'express';
import router from '../src/routes/routes.js';
import connection from '../src/connection/connection.js';

const { connectDB, closeDB, getPool } = connection;

// Configuración de una instancia de Express aislada para las pruebas
const app = express();
app.use(express.json());
app.use('/api', router); 

// Arreglo para rastrear los correos creados y borrarlos al finalizar los tests
const createdEmails: string[] = [];
let uniqueCounter = 0;

// Variables globales para almacenar IDs temporales y cumplir con las llaves foráneas (FK)
let dummyShiftId: string;
let dummyShopId: string;
let dummyManagerId: string;

// Función auxiliar para generar un correo único y evitar errores de colisión (UNIQUE constraint)
const generateUniqueEmail = () => {
    uniqueCounter += 1;
    return `del_test_${Date.now()}_${uniqueCounter}@mrbarber.com`;
};

// Función auxiliar para generar un número de teléfono único de exactamente 10 dígitos
const generateUniquePhone = () => {
    uniqueCounter += 1;
    return `${Date.now()}${uniqueCounter}`.slice(-10);
};

// Setup: Se ejecuta una sola vez antes de comenzar todas las pruebas
beforeAll(async () => {
    await connectDB();
    const pool = getPool();

    // 1. Obtiene un turno (shift) existente en la base de datos para asignarlo a los barberos
    const shiftRes = await pool.query('SELECT id FROM shifts LIMIT 1');
    dummyShiftId = shiftRes.rows[0].id;

    // 2. Crea un usuario con rol de mánager global para poder asignarle una tienda
    const mgrEmail = generateUniqueEmail();
    createdEmails.push(mgrEmail); 
    const mgrUserRes = await pool.query(
        `INSERT INTO users (role, email, phone, password_hash, first_name, last_name) 
         VALUES ('manager', $1, '9999999999', 'hash', 'Global', 'Manager') RETURNING id`,
        [mgrEmail]
    );
    dummyManagerId = mgrUserRes.rows[0].id;
    await pool.query('INSERT INTO managers (user_id) VALUES ($1)', [dummyManagerId]);

    // 3. Crea una tienda (shop) temporal asociada al mánager creado en el paso anterior
    const shopRes = await pool.query(
        `INSERT INTO shops (name, manager_id) VALUES ($1, $2) RETURNING id`,
        [`Shop_Test_${Date.now()}`, dummyManagerId]
    );
    dummyShopId = shopRes.rows[0].id;
});

// Teardown: Se ejecuta al finalizar todas las pruebas para limpiar la base de datos (evitar basura)
afterAll(async () => {
    const pool = getPool();
    if (createdEmails.length > 0) {
        // Busca todos los usuarios generados en la prueba actual
        const usersRes = await pool.query('SELECT id FROM users WHERE email = ANY($1)', [createdEmails]);
        const userIds = usersRes.rows.map(row => row.id);

        if (userIds.length > 0) {
            // Limpieza exacta en orden jerárquico inverso para no violar las restricciones RESTRICT de las llaves foráneas
            await pool.query('DELETE FROM barbers WHERE user_id = ANY($1)', [userIds]);
            await pool.query('DELETE FROM receptionists WHERE user_id = ANY($1)', [userIds]);
            await pool.query('DELETE FROM shops WHERE manager_id = ANY($1)', [userIds]); // Las tiendas deben borrarse antes que el mánager
            await pool.query('DELETE FROM managers WHERE user_id = ANY($1)', [userIds]);
            await pool.query('DELETE FROM clients WHERE user_id = ANY($1)', [userIds]);  // Borra los clientes generados por defecto en el registro
            
            // Finalmente borra el registro principal de la tabla users
            await pool.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
        }
    }
    await closeDB();
});

describe('Pruebas de eliminación de usuarios por roles', () => {
    const testPassword = 'password123';

    test('DELETE /api/users/:id - Borrado físico para el rol CLIENTE', async () => {
        const email = generateUniqueEmail();
        createdEmails.push(email);

        // Paso 1: Registrar un nuevo cliente
        const registerResponse = await request(app).post('/api/auth/register').send({
            firstName: 'Client',
            lastName: 'User',
            phone: generateUniquePhone(),
            email: email,
            password: testPassword
        });

        if (!registerResponse.body || !registerResponse.body.data) {
            throw new Error(`Fallo en el registro. Respuesta del servidor: ${JSON.stringify(registerResponse.body)}`);
        }

        const { token, user } = registerResponse.body.data;

        // Paso 2: Ejecutar la petición DELETE mandando el token JWT en el header
        const deleteResponse = await request(app)
            .delete(`/api/users/${user.id}`) 
            .set('Authorization', `Bearer ${token}`);

        expect(deleteResponse.statusCode).toBe(200);

        // Paso 3: Verificar en la BD que el usuario ya no exista físicamente (Hard delete)
        const dbCheck = await getPool().query('SELECT id FROM users WHERE id = $1', [user.id]);
        expect(dbCheck.rows.length).toBe(0);
    });

    test('DELETE /api/users/:id - Borrado lógico para el rol MANAGER', async () => {
        const email = generateUniqueEmail();
        createdEmails.push(email);

        // Paso 1: Crear la cuenta inicial (el sistema la crea como cliente por defecto)
        const registerResponse = await request(app).post('/api/auth/register').send({
            firstName: 'Manager',
            lastName: 'Admin',
            phone: generateUniquePhone(),
            email: email,
            password: testPassword
        });

        if (!registerResponse.body || !registerResponse.body.data) {
            throw new Error(`Fallo en el registro. Respuesta del servidor: ${JSON.stringify(registerResponse.body)}`);
        }

        const { token, user } = registerResponse.body.data;
        const pool = getPool();

        // Paso 2: Promover el usuario a mánager forzando la actualización en la BD
        await pool.query("UPDATE users SET role = 'manager' WHERE id = $1", [user.id]);
        await pool.query("INSERT INTO managers (user_id) VALUES ($1)", [user.id]);

        // Paso 3: Ejecutar la petición de borrado
        const deleteResponse = await request(app)
            .delete(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteResponse.statusCode).toBe(200);

        // Paso 4: Verificar que el registro en 'managers' sigue existiendo pero su campo 'deleted_at' ya tiene una fecha (Soft delete)
        const dbCheck = await pool.query('SELECT deleted_at FROM managers WHERE user_id = $1', [user.id]);
        expect(dbCheck.rows.length).toBe(1);
        expect(dbCheck.rows[0].deleted_at).not.toBeNull();
    });

    test('DELETE /api/users/:id - Borrado lógico para el rol BARBERO', async () => {
        const email = generateUniqueEmail();
        createdEmails.push(email);

        // Paso 1: Crear la cuenta inicial
        const registerResponse = await request(app).post('/api/auth/register').send({
            firstName: 'Barber',
            lastName: 'Pro',
            phone: generateUniquePhone(),
            email: email,
            password: testPassword
        });

        if (!registerResponse.body || !registerResponse.body.data) {
            throw new Error(`Fallo en el registro. Respuesta del servidor: ${JSON.stringify(registerResponse.body)}`);
        }

        const { token, user } = registerResponse.body.data;
        const pool = getPool();

        // Paso 2: Promover el usuario a barbero y enlazarlo con la tienda y turno creados globalmente en el Setup
        await pool.query("UPDATE users SET role = 'barber' WHERE id = $1", [user.id]);
        await pool.query(
            "INSERT INTO barbers (user_id, shop_id, shift_id) VALUES ($1, $2, $3)", 
            [user.id, dummyShopId, dummyShiftId]
        );

        // Paso 3: Ejecutar la petición de borrado
        const deleteResponse = await request(app)
            .delete(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteResponse.statusCode).toBe(200);

        // Paso 4: Verificar el borrado lógico (Soft delete) revisando el campo deleted_at
        const dbCheck = await pool.query('SELECT deleted_at FROM barbers WHERE user_id = $1', [user.id]);
        expect(dbCheck.rows.length).toBe(1);
        expect(dbCheck.rows[0].deleted_at).not.toBeNull();
    });

    test('DELETE /api/users/:id - 403 Forbidden si un MANAGER intenta borrar a otro MANAGER', async () => {
        const pool = getPool();

        // 1. Crear el Mánager 1 (El que ejecuta la acción)
        const actorEmail = generateUniqueEmail();
        createdEmails.push(actorEmail);

        const registerActorResponse = await request(app).post('/api/auth/register').send({
            firstName: 'Actor',
            lastName: 'Manager',
            phone: generateUniquePhone(),
            email: actorEmail,
            password: testPassword
        });

        if (!registerActorResponse.body || !registerActorResponse.body.data) {
            throw new Error(`Fallo en el registro del Actor. Respuesta: ${JSON.stringify(registerActorResponse.body)}`);
        }

        const actor = registerActorResponse.body.data;
        
        // Promover Actor a Mánager en la BD
        await pool.query("UPDATE users SET role = 'manager' WHERE id = $1", [actor.user.id]);
        await pool.query("INSERT INTO managers (user_id) VALUES ($1)", [actor.user.id]);

        // OBTENER UN NUEVO TOKEN ACTUALIZADO PARA EL ACTOR
        const loginActorResponse = await request(app).post('/api/auth/login').send({
            email: actorEmail,
            password: testPassword
        });
        const validActorToken = loginActorResponse.body.data.token;

        // 2. Crear el Mánager 2 (El objetivo a eliminar)
        const targetEmail = generateUniqueEmail();
        createdEmails.push(targetEmail);

        const registerTargetResponse = await request(app).post('/api/auth/register').send({
            firstName: 'Target',
            lastName: 'Manager',
            phone: generateUniquePhone(),
            email: targetEmail,
            password: testPassword
        });

        if (!registerTargetResponse.body || !registerTargetResponse.body.data) {
            throw new Error(`Fallo en el registro del Target. Respuesta: ${JSON.stringify(registerTargetResponse.body)}`);
        }

        const target = registerTargetResponse.body.data;

        // Promover Target a Mánager en la BD
        await pool.query("UPDATE users SET role = 'manager' WHERE id = $1", [target.user.id]);
        await pool.query("INSERT INTO managers (user_id) VALUES ($1)", [target.user.id]);

        // 3. Ejecutar la petición usando el token ACTUALIZADO del Mánager 1
        const deleteResponse = await request(app)
            .delete(`/api/users/${target.user.id}`)
            .set('Authorization', `Bearer ${validActorToken}`);

        // 4. Verificaciones
        expect(deleteResponse.statusCode).toBe(403);
        expect(deleteResponse.body.message).toBe('Forbidden: Managers cannot delete other managers');

        // La base de datos debe permanecer intacta (sin borrado lógico)
        const dbCheck = await pool.query('SELECT deleted_at FROM managers WHERE user_id = $1', [target.user.id]);
        expect(dbCheck.rows.length).toBe(1);
        expect(dbCheck.rows[0].deleted_at).toBeNull();
    });
});