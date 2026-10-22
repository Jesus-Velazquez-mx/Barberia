import connection from '../../src/connection/connection.js';
import type { UserRole } from '../../src/types/entities/user.interface.js';
import { generateUniqueEmail, generateUniquePhone, generateUniqueName } from './uniqueValues.js';

const { getPool } = connection;

// Estado centralizado de fixtures para rastreo y limpieza segura en cascada
export const createdAppointmentIds: string[] = [];
export const createdAvailabilitySlotIds: string[] = [];
export const createdServiceIds: string[] = [];
export const createdServiceCategoryIds: string[] = [];
export const createdBarberIds: string[] = [];
export const createdShopIds: string[] = [];
export const createdShiftIds: string[] = [];
export const createdManagerIds: string[] = [];
export const createdUserIds: string[] = [];

export const generateUniqueFixtureEmail = (prefix = 'fixture') => generateUniqueEmail(prefix);

export const generateUniqueFixturePhone = () => generateUniquePhone();

export const generateUniqueFixtureName = (prefix = 'Test') => generateUniqueName(prefix);

/**
 * Inserta un usuario base en la tabla 'users'.
 */
export const insertUser = async (role: UserRole = 'client'): Promise<{ id: string; email: string }> => {
    const email = generateUniqueFixtureEmail(role);
    const phone = generateUniqueFixturePhone();
    const result = await getPool().query(
        `INSERT INTO users (role, email, phone, password_hash, first_name, last_name, birth_date, gender)
         VALUES ($1, $2, $3, 'unused_hash', 'Fixture', 'User', '1990-01-01', 'other') RETURNING id`,
        [role, email, phone]
    );
    const id = result.rows[0].id;
    createdUserIds.push(id);
    return { id, email };
};

/**
 * Inserta un manager con su registro correspondiente en 'managers'.
 */
export const insertManager = async (): Promise<{ id: string; email: string }> => {
    const user = await insertUser('manager');
    await getPool().query('INSERT INTO managers (user_id, title) VALUES ($1, $2)', [user.id, 'Store Manager']);
    createdManagerIds.push(user.id);
    return user;
};

/**
 * Inserta una sucursal en la tabla 'shops'.
 */
export const insertShop = async (
    managerId: string,
    options?: { name?: string; isActive?: boolean }
): Promise<string> => {
    const name = options?.name ?? generateUniqueFixtureName('Shop');
    const isActive = options?.isActive !== undefined ? options.isActive : true;
    const result = await getPool().query(
        `INSERT INTO shops (name, manager_id, is_active) VALUES ($1, $2, $3) RETURNING id`,
        [name, managerId, isActive]
    );
    const id = result.rows[0].id;
    createdShopIds.push(id);
    return id;
};

/**
 * Inserta un turno en la tabla 'shifts' o reutiliza uno existente si ya existe uno con ese nombre.
 */
export const insertShift = async (
    name: string,
    startTime = '08:00',
    endTime = '16:00'
): Promise<string> => {
    const existing = await getPool().query(`SELECT id FROM shifts WHERE name = $1`, [name]);
    if (existing.rows.length > 0) {
        return existing.rows[0].id;
    }
    const result = await getPool().query(
        `INSERT INTO shifts (name, start_time, end_time) VALUES ($1, $2, $3) RETURNING id`,
        [name, startTime, endTime]
    );
    const id = result.rows[0].id;
    createdShiftIds.push(id);
    return id;
};

/**
 * Inserta un barbero directamente en la tabla 'barbers' (no son usuarios con cuenta).
 */
export const insertBarber = async (
    shopId: string,
    options?: {
        shiftId?: string;
        bio?: string;
        isAcceptingBookings?: boolean;
        isDeleted?: boolean;
        firstName?: string;
        lastName?: string;
    }
): Promise<{ id: string; email: string }> => {
    let shiftId = options?.shiftId;
    if (!shiftId) {
        const shiftRes = await getPool().query(`SELECT id FROM shifts LIMIT 1`);
        shiftId = shiftRes.rows[0].id;
    }
    const email = generateUniqueFixtureEmail('barber');
    const phone = generateUniqueFixturePhone();
    const result = await getPool().query(
        `INSERT INTO barbers (email, phone, first_name, last_name, shop_id, shift_id, bio, is_accepting_bookings, deleted_at, birth_date, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '1990-01-01', 'other') RETURNING id`,
        [
            email,
            phone,
            options?.firstName ?? 'Barber',
            options?.lastName ?? 'Fixture',
            shopId,
            shiftId,
            options?.bio ?? 'Bio test',
            options?.isAcceptingBookings ?? true,
            options?.isDeleted ? new Date() : null,
        ]
    );
    const id = result.rows[0].id;
    createdBarberIds.push(id);
    return { id, email };
};

/**
 * Inserta una categoría de servicios si no existe ya una categoría por defecto.
 */
export const insertServiceCategory = async (name?: string): Promise<string> => {
    const categoryName = name ?? generateUniqueFixtureName('Category');
    const result = await getPool().query(
        `INSERT INTO services_categories (name, description) VALUES ($1, 'Fixture category') RETURNING id`,
        [categoryName]
    );
    const id = result.rows[0].id;
    createdServiceCategoryIds.push(id);
    return id;
};

/**
 * Inserta un servicio en la tabla 'services'.
 */
export const insertService = async (options?: {
    categoryId?: string;
    name?: string;
    durationMinutes?: number;
    price?: number;
    isActive?: boolean;
}): Promise<string> => {
    // Categoría propia: reutilizar una existente choca con otros archivos de test que corren en paralelo
    const categoryId = options?.categoryId ?? (await insertServiceCategory());

    const name = options?.name ?? generateUniqueFixtureName('Service');
    const durationMinutes = options?.durationMinutes ?? 30;
    const price = options?.price ?? 200.0;
    const isActive = options?.isActive !== undefined ? options.isActive : true;

    const result = await getPool().query(
        `INSERT INTO services (category_id, name, description, duration_minutes, price, is_active)
         VALUES ($1, $2, 'Fixture service description', $3, $4, $5) RETURNING id`,
        [categoryId, name, durationMinutes, price, isActive]
    );
    const id = result.rows[0].id;
    createdServiceIds.push(id);
    return id;
};

/**
 * Inserta una plantilla de disponibilidad en 'availability_slots'.
 */
export const insertAvailabilitySlot = async (
    barberId: string,
    shopId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    isActive = true
): Promise<string> => {
    const result = await getPool().query(
        `INSERT INTO availability_slots (barber_id, shop_id, day_of_week, start_time, end_time, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [barberId, shopId, dayOfWeek, startTime, endTime, isActive]
    );
    const id = result.rows[0].id;
    createdAvailabilitySlotIds.push(id);
    return id;
};

/**
 * Inserta una cita en la tabla 'appointments'.
 */
export const insertAppointment = async (
    shopId: string,
    barberId: string,
    scheduledStart: Date | string,
    scheduledEnd: Date | string,
    options?: {
        clientId?: string;
        guestClientName?: string;
        isWalkIn?: boolean;
        status?: 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
    }
): Promise<string> => {
    const isRegisteredClient = !!options?.clientId;
    const guestClientName = isRegisteredClient ? null : (options?.guestClientName ?? 'Guest Fixture');
    const clientId = options?.clientId ?? null;
    const status = options?.status ?? 'scheduled';
    const isWalkIn = options?.isWalkIn ?? false;

    const result = await getPool().query(
        `INSERT INTO appointments (shop_id, barber_id, client_id, is_registered_client, guest_client_name, is_walk_in, status, scheduled_start, scheduled_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [shopId, barberId, clientId, isRegisteredClient, guestClientName, isWalkIn, status, scheduledStart, scheduledEnd]
    );
    const id = result.rows[0].id;
    createdAppointmentIds.push(id);
    return id;
};

/**
 * Limpieza respetando estrictamente el orden de llaves foráneas:
 * 1. appointments (depende de barbers, shops, clients/users)
 * 2. availability_slots (depende de barbers, shops)
 * 3. services (depende de services_categories)
 * 4. services_categories
 * 5. barbers (depende de shops, shifts)
 * 6. shops (depende de managers)
 * 7. managers (depende de users)
 * 8. users
 * 9. shifts (si se crearon turnos adicionales de prueba)
 */
export const cleanupFixtures = async () => {
    const pool = getPool();

    if (createdAppointmentIds.length > 0) {
        await pool.query(`DELETE FROM appointments WHERE id = ANY($1::uuid[])`, [createdAppointmentIds]);
        createdAppointmentIds.length = 0;
    }

    if (createdAvailabilitySlotIds.length > 0) {
        await pool.query(`DELETE FROM availability_slots WHERE id = ANY($1::uuid[])`, [createdAvailabilitySlotIds]);
        createdAvailabilitySlotIds.length = 0;
    }

    if (createdServiceIds.length > 0) {
        await pool.query(`DELETE FROM services WHERE id = ANY($1::uuid[])`, [createdServiceIds]);
        createdServiceIds.length = 0;
    }

    if (createdServiceCategoryIds.length > 0) {
        await pool.query(`DELETE FROM services_categories WHERE id = ANY($1::uuid[])`, [createdServiceCategoryIds]);
        createdServiceCategoryIds.length = 0;
    }

    if (createdBarberIds.length > 0) {
        await pool.query(`DELETE FROM barbers WHERE id = ANY($1::uuid[])`, [createdBarberIds]);
        createdBarberIds.length = 0;
    }

    if (createdShopIds.length > 0) {
        await pool.query(`DELETE FROM shops WHERE id = ANY($1::uuid[])`, [createdShopIds]);
        createdShopIds.length = 0;
    }

    if (createdManagerIds.length > 0) {
        await pool.query(`DELETE FROM managers WHERE user_id = ANY($1::uuid[])`, [createdManagerIds]);
        createdManagerIds.length = 0;
    }

    if (createdUserIds.length > 0) {
        await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [createdUserIds]);
        createdUserIds.length = 0;
    }

    if (createdShiftIds.length > 0) {
        await pool.query(`DELETE FROM shifts WHERE id = ANY($1::uuid[])`, [createdShiftIds]);
        createdShiftIds.length = 0;
    }
};
