import db from '../connection/connection.js';
import type { Barber } from '../types/entities/barber.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

export interface UpdateBarberInput {
    id: string;
    bio?: string;
    isAcceptingBookings?: boolean;
}

export interface CreateBarberInput {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    birthDate: string;
    gender: string;
    shopId: string;
    shiftId: string;
    bio?: string | null;
    isAcceptingBookings?: boolean;
}

const BARBER_COLUMNS = `id, first_name, last_name, email, phone, shop_id, shift_id, bio, is_accepting_bookings, birth_date, gender, deleted_at, created_at, updated_at`;

/**
 * Busca un barbero por su id.
 */
export const getBarberById = async (id: string): Promise<Barber | null> => {
    const pool = db.getPool();
    const result = await pool.query(
        `SELECT ${BARBER_COLUMNS} FROM barbers WHERE id = $1`,
        [id]
    );
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca un barbero por email. Es vital que NO filtre por deleted_at,
 * así el servicio puede detectar si el correo pertenece a un barbero dado de baja.
 */
export const getBarberByEmail = async (email: string): Promise<Barber | null> => {
    const pool = db.getPool();
    const result = await pool.query(
        `SELECT ${BARBER_COLUMNS} FROM barbers WHERE email = $1`,
        [email]
    );
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca un barbero por teléfono para evitar duplicados.
 */
export const getBarberByPhone = async (phone: string): Promise<Barber | null> => {
    const pool = db.getPool();
    const result = await pool.query(
        `SELECT ${BARBER_COLUMNS} FROM barbers WHERE phone = $1`,
        [phone]
    );
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Registra un nuevo barbero.
 */
export const createBarber = async (data: CreateBarberInput): Promise<Barber> => {
    const pool = db.getPool();
    
    const query = `
        INSERT INTO barbers (first_name, last_name, email, phone, birth_date, gender, shop_id, shift_id, bio, is_accepting_bookings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING ${BARBER_COLUMNS}
    `;
    
    const values = [
        data.firstName,
        data.lastName,
        data.email,
        data.phone ?? null,
        data.birthDate,
        data.gender,
        data.shopId,
        data.shiftId,
        data.bio ?? null,
        data.isAcceptingBookings !== undefined ? data.isAcceptingBookings : true
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Reactiva a un barbero que fue dado de baja (deleted_at IS NOT NULL) y actualiza
 * toda su información con los datos enviados en el formulario de registro.
 */
export const reactivateBarber = async (id: string, data: CreateBarberInput): Promise<Barber> => {
    const pool = db.getPool();
    
    const query = `
        UPDATE barbers
        SET first_name = $1,
            last_name = $2,
            email = $3,
            phone = $4,
            birth_date = $5,
            gender = $6,
            shop_id = $7,
            shift_id = $8,
            bio = $9,
            is_accepting_bookings = $10,
            deleted_at = NULL,
            updated_at = NOW()
        WHERE id = $11
        RETURNING ${BARBER_COLUMNS}
    `;
    
    const values = [
        data.firstName,
        data.lastName,
        data.email,
        data.phone ?? null,
        data.birthDate,
        data.gender,
        data.shopId,
        data.shiftId,
        data.bio ?? null,
        data.isAcceptingBookings !== undefined ? data.isAcceptingBookings : true,
        id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Actualiza el perfil (bio / is_accepting_bookings) de un barbero.
 * Solo modifica las columnas presentes en `fields`. 
 * AND deleted_at IS NULL evita editar un barbero que ya fue dado de baja.
 */
export const updateBarberProfileById = async (fields: UpdateBarberInput): Promise<Barber> => {
    const pool = db.getPool();

    const setClauses: string[] = [];
    const values: unknown[] = [];

    const columnByField: [keyof Omit<UpdateBarberInput, 'id'>, string][] = [
        ['bio', 'bio'],
        ['isAcceptingBookings', 'is_accepting_bookings'],
    ];

    for (const [field, column] of columnByField) {
        const value = fields[field];
        if (value !== undefined) {
            values.push(value);
            setClauses.push(`${column} = $${values.length}`);
        }
    }

    if (setClauses.length === 0) {
        throw new ApiError(ApiErrorCode.BAD_REQUEST, 'No fields to update');
    }

    values.push(fields.id);
    const result = await pool.query(
        `UPDATE barbers SET ${setClauses.join(', ')}
         WHERE id = $${values.length} AND deleted_at IS NULL
         RETURNING ${BARBER_COLUMNS}`,
        values
    );

    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }

    return result.rows[0];
};

/**
 * Da de baja lógicamente a un barbero (deleted_at = NOW()).
 */
export const softDeleteBarberById = async (id: string): Promise<void> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('SELECT id FROM barbers WHERE id = $1 FOR UPDATE', [id]);
        await client.query(`UPDATE barbers SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [id]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Obtiene los barberos de una sucursal específica que están activos y aceptan reservas.
 */
export const getActiveBarbersByShop = async (shopId: string): Promise<Barber[]> => {
    const pool = db.getPool();
    const query = `
        SELECT ${BARBER_COLUMNS}
        FROM barbers 
        WHERE shop_id = $1 
          AND deleted_at IS NULL 
          AND is_accepting_bookings = true
    `;
    const result = await pool.query<Barber>(query, [shopId]);
    return result.rows;
};

/**
 * Obtiene los barberos de una sucursal sin filtrar por is_accepting_bookings. Por defecto excluye
 * a los dados de baja (deleted_at IS NOT NULL); con includeDeleted los incluye.
 */
export const getBarbersByShop = async (shopId: string, includeDeleted = false): Promise<Barber[]> => {
    const pool = db.getPool();
    const query = `
        SELECT ${BARBER_COLUMNS}
        FROM barbers
        WHERE shop_id = $1
          ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
        ORDER BY first_name, last_name
    `;
    const result = await pool.query<Barber>(query, [shopId]);
    return result.rows;
};