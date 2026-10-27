import db from '../connection/connection.js';
import type { Shop } from '../types/entities/shop.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import type { CreateShopRequest, UpdateShopRequest } from '../types/dto/shopRequest.interface.js';

export type CreateShopInput = CreateShopRequest & { managerId: string };
export type UpdateShopInput = UpdateShopRequest;

/**
 * Recupera todas las sucursales que están actualmente activas, ordenadas alfabéticamente.
 */
export const getActiveShops = async (): Promise<Shop[]> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, street, postal_code, number, phone, manager_id, is_active, created_at, updated_at
        FROM shops 
        WHERE is_active = true 
        ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Recupera todas las sucursales (activas e inactivas), ordenadas alfabéticamente.
 */
export const getAllShops = async (): Promise<Shop[]> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, street, postal_code, number, phone, manager_id, is_active, created_at, updated_at
        FROM shops 
        ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Busca una sucursal por su ID. No filtra por is_active.
 */
export const getShopById = async (id: string): Promise<Shop | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, street, postal_code, number, phone, manager_id, is_active, created_at, updated_at
        FROM shops 
        WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * IDs de todas las sucursales (activas e inactivas) que administra un gerente.
 */
export const getShopIdsByManagerId = async (managerId: string): Promise<string[]> => {
    const pool = db.getPool();
    const result = await pool.query('SELECT id FROM shops WHERE manager_id = $1', [managerId]);
    return result.rows.map((row) => row.id);
};

/**
 * Busca una sucursal por nombre (sin distinguir mayúsculas/minúsculas).
 */
export const getShopByName = async (name: string): Promise<Shop | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, street, postal_code, number, phone, manager_id, is_active, created_at, updated_at
        FROM shops 
        WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [name]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Inserta una nueva sucursal en la base de datos.
 */
export const createShop = async (data: CreateShopInput): Promise<Shop> => {
    const pool = db.getPool();
    const query = `
        INSERT INTO shops (name, street, postal_code, number, phone, manager_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, street, postal_code, number, phone, manager_id, is_active, created_at, updated_at
    `;
    const values = [
        data.name,
        data.street ?? null,
        data.postalCode ?? null,
        data.number ?? null,
        data.phone ?? null,
        data.managerId,
        data.isActive !== undefined ? data.isActive : true,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Actualiza los campos especificados de una sucursal.
 */
export const updateShop = async (id: string, fields: UpdateShopInput): Promise<Shop> => {
    const pool = db.getPool();

    const columnByField: [keyof UpdateShopInput, string][] = [
        ['name', 'name'],
        ['street', 'street'],
        ['postalCode', 'postal_code'],
        ['number', 'number'],
        ['phone', 'phone'],
        ['managerId', 'manager_id'],
        ['isActive', 'is_active'],
    ];

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [field, column] of columnByField) {
        const value = fields[field];
        if (value !== undefined) {
            values.push(value);
            setClauses.push(`${column} = $${values.length}`);
        }
    }

    if (setClauses.length === 0) {
        const existing = await getShopById(id);
        if (!existing) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
        }
        return existing;
    }

    values.push(id);
    const query = `
        UPDATE shops
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length}
        RETURNING id, name, street, postal_code, number, phone, manager_id, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
    }
    return result.rows[0];
};

/**
 * Realiza un borrado lógico de la sucursal actualizando is_active = false.
 */
export const softDeleteShop = async (id: string): Promise<Shop> => {
    const pool = db.getPool();
    const query = `
        UPDATE shops
        SET is_active = false
        WHERE id = $1
        RETURNING id, name, street, postal_code, number, phone, manager_id, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
    }
    return result.rows[0];
};
