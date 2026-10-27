import db from '../connection/connection.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import type { Supply } from '../types/entities/supply.interface.js';

export type CreateSupplyInput = {
    shopId: string;
    categoryId: string;
    name: string;
    description?: string | null;
    unit?: string;
    sku?: string | null;
};

export type UpdateSupplyInput = Partial<CreateSupplyInput>;

/**
 * Recupera los insumos. Permite filtrar opcionalmente por sucursal.
 */
export const getAllSupplies = async (shopId?: string): Promise<Supply[]> => {
    const pool = db.getPool();
    let query = `
        SELECT id, shop_id, category_id, name, description, unit, sku, created_at, updated_at
        FROM supplies
    `;
    const values: string[] = [];

    if (shopId) {
        query += ` WHERE shop_id = $1`;
        values.push(shopId);
    }

    query += ` ORDER BY name ASC`;

    const result = await pool.query(query, values);
    return result.rows;
};

/**
 * Busca un insumo por su ID.
 */
export const getSupplyById = async (id: string): Promise<Supply | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id, shop_id, category_id, name, description, unit, sku, created_at, updated_at
        FROM supplies 
        WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca un insumo por nombre dentro de una sucursal específica.
 */
export const getSupplyByNameAndShop = async (name: string, shopId: string): Promise<Supply | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id FROM supplies 
        WHERE LOWER(name) = LOWER($1) AND shop_id = $2
    `;
    const result = await pool.query(query, [name, shopId]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca un insumo por SKU dentro de una sucursal específica.
 */
export const getSupplyBySkuAndShop = async (sku: string, shopId: string): Promise<Supply | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id FROM supplies 
        WHERE sku = $1 AND shop_id = $2
    `;
    const result = await pool.query(query, [sku, shopId]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Inserta un nuevo insumo en la base de datos.
 */
export const createSupply = async (data: CreateSupplyInput): Promise<Supply> => {
    const pool = db.getPool();
    const query = `
        INSERT INTO supplies (shop_id, category_id, name, description, unit, sku)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, shop_id, category_id, name, description, unit, sku, created_at, updated_at
    `;
    const values = [
        data.shopId,
        data.categoryId,
        data.name,
        data.description ?? null,
        data.unit ?? 'unit',
        data.sku ?? null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Actualiza los campos especificados de un insumo existente.
 */
export const updateSupply = async (id: string, fields: UpdateSupplyInput): Promise<Supply> => {
    const pool = db.getPool();
    const columnByField: [keyof UpdateSupplyInput, string][] = [
        ['shopId', 'shop_id'],
        ['categoryId', 'category_id'],
        ['name', 'name'],
        ['description', 'description'],
        ['unit', 'unit'],
        ['sku', 'sku'],
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
        const existing = await getSupplyById(id);
        if (!existing) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Supply not found');
        return existing;
    }

    values.push(id);
    const query = `
        UPDATE supplies
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length}
        RETURNING id, shop_id, category_id, name, description, unit, sku, created_at, updated_at
    `;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Supply not found');
    }
    return result.rows[0];
};

/**
 * Realiza un borrado físico del insumo.
 */
export const deleteSupply = async (id: string): Promise<void> => {
    const pool = db.getPool();
    const query = `DELETE FROM supplies WHERE id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Supply not found');
    }
};
