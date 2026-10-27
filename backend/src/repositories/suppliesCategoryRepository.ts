import db from '../connection/connection.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import type { SupplyCategory } from '../types/entities/supplyCategory.interface.js';

export type CreateCategoryInput = { name: string; description?: string | null };
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

/**
 * Recupera todas las categorías de insumos, ordenadas alfabéticamente por nombre.
 */
export const getAllCategories = async (): Promise<SupplyCategory[]> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, description, created_at, updated_at
        FROM supplies_categories 
        ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Busca una categoría de insumos por su ID.
 */
export const getCategoryById = async (id: string): Promise<SupplyCategory | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, description, created_at, updated_at
        FROM supplies_categories 
        WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca una categoría de insumos por nombre (sin distinguir mayúsculas/minúsculas).
 */
export const getCategoryByName = async (name: string): Promise<SupplyCategory | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, description, created_at, updated_at
        FROM supplies_categories 
        WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [name]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Inserta una nueva categoría de insumos en la base de datos.
 */
export const createCategory = async (data: CreateCategoryInput): Promise<SupplyCategory> => {
    const pool = db.getPool();
    const query = `
        INSERT INTO supplies_categories (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
    `;
    const result = await pool.query(query, [data.name, data.description ?? null]);
    return result.rows[0];
};

/**
 * Actualiza los campos especificados de una categoría de insumos existente.
 */
export const updateCategory = async (id: string, fields: UpdateCategoryInput): Promise<SupplyCategory> => {
    const pool = db.getPool();
    const columnByField: [keyof UpdateCategoryInput, string][] = [
        ['name', 'name'],
        ['description', 'description'],
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
        const existing = await getCategoryById(id);
        if (!existing) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
        return existing;
    }

    values.push(id);
    const query = `
        UPDATE supplies_categories
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length}
        RETURNING id, name, description, created_at, updated_at
    `;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }
    return result.rows[0];
};

/**
 * Realiza un borrado físico de la categoría en la base de datos.
 */
export const deleteCategory = async (id: string): Promise<void> => {
    const pool = db.getPool();

    const query = `DELETE FROM supplies_categories WHERE id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }
};
