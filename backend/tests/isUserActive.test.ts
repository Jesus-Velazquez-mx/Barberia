import { isUserActive } from '../src/repositories/userRepository.js';
import connection from '../src/connection/connection.js';
import { loadConfig } from '../src/config/globalConfig.js';
import type { UserRole } from '../src/types/entities/user.interface.js';

export const globalConfig = loadConfig();
const { connectDB, closeDB, getPool } = connection;

const createdUserIds: string[] = [];

let uniqueCounter = 0;
const generateUniqueEmail = () => {
    uniqueCounter += 1;
    return `is_user_active_test_${Date.now()}_${uniqueCounter}@mrbarber.com`;
};
const generateUniquePhone = () => {
    uniqueCounter += 1;
    return `${Date.now()}${uniqueCounter}`.slice(-10);
};

const insertUser = async (role: UserRole): Promise<string> => {
    const result = await getPool().query(
        `INSERT INTO users (role, email, phone, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, 'unused', 'Test', 'User') RETURNING id`,
        [role, generateUniqueEmail(), generateUniquePhone()]
    );
    const id = result.rows[0].id;
    createdUserIds.push(id);
    return id;
};

const insertManager = async (deletedAt: Date | null = null): Promise<string> => {
    const userId = await insertUser('manager');
    await getPool().query('INSERT INTO managers (user_id, title, deleted_at) VALUES ($1, $2, $3)', [
        userId,
        'Manager',
        deletedAt
    ]);
    return userId;
};

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    if (createdUserIds.length > 0) {
        await getPool().query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
    await closeDB();
});

describe('isUserActive', () => {
    test('devuelve true para un cliente (nunca se da de baja, se elimina físicamente)', async () => {
        const clientId = await insertUser('client');

        await expect(isUserActive(clientId)).resolves.toBe(true);
    });

    test('devuelve true para un manager activo (deleted_at NULL)', async () => {
        const managerId = await insertManager(null);

        await expect(isUserActive(managerId)).resolves.toBe(true);
    });

    test('devuelve false para un manager dado de baja (deleted_at con valor)', async () => {
        const managerId = await insertManager(new Date());

        await expect(isUserActive(managerId)).resolves.toBe(false);
    });

    test('devuelve false cuando el id de usuario no existe', async () => {
        await expect(isUserActive('00000000-0000-0000-0000-000000000000')).resolves.toBe(false);
    });
});
