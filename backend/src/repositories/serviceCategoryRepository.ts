import db from '../connection/connection.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import type { ServiceCategory } from '../types/entities/serviceCategory.interface.js';

export type CreateServiceCategoryInput = { name: string; description?: string | null };
export type UpdateServiceCategoryInput = Partial<CreateServiceCategoryInput>;

/**
 * Recupera todas las categorías de servicios ordenadas alfabéticamente por nombre.
 */
export const getAllCategories = async (): Promise<ServiceCategory[]> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, description, created_at, updated_at
        FROM services_categories 
        ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Busca una categoría de servicios por su identificador único (UUID).
 */
export const getCategoryById = async (id: string): Promise<ServiceCategory | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, description, created_at, updated_at
        FROM services_categories 
        WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca una categoría de servicios por su nombre exacto (insensible a mayúsculas y minúsculas).
 */
export const getCategoryByName = async (name: string): Promise<ServiceCategory | null> => {
    const pool = db.getPool();
    const query = `
        SELECT id, name, description, created_at, updated_at
        FROM services_categories 
        WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [name]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Inserta una nueva categoría de servicios.
 */
export const createCategory = async (data: CreateServiceCategoryInput): Promise<ServiceCategory> => {
    const pool = db.getPool();
    const query = `
        INSERT INTO services_categories (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
    `;
    const result = await pool.query(query, [data.name, data.description ?? null]);
    return result.rows[0];
};

/**
 * Actualiza los campos especificados de una categoría de servicios existente.
 */
export const updateCategory = async (id: string, fields: UpdateServiceCategoryInput): Promise<ServiceCategory> => {
    const pool = db.getPool();
    const columnByField: [keyof UpdateServiceCategoryInput, string][] = [
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
        UPDATE services_categories
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
 * Elimina físicamente una categoría de servicios.
 */
export const deleteCategory = async (id: string): Promise<void> => {
    const pool = db.getPool();
    const query = `DELETE FROM services_categories WHERE id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }
};
