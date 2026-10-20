import db from '../connection/connection.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import type { ServiceCategory } from '../types/entities/serviceCategory.interface.js';

export type CreateServiceCategoryInput = { name: string; description?: string | null; isActive?: boolean };
export type UpdateServiceCategoryInput = Partial<CreateServiceCategoryInput>;

const COLUMNS = 'id, name, description, is_active, created_at, updated_at';

/**
 * Recupera todas las categorías de servicios.
 */
export const getAllCategories = async (): Promise<ServiceCategory[]> => {
    const pool = db.getPool();
    const query = `
        SELECT ${COLUMNS}
        FROM services_categories 
        ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Busca una categoría por ID.
 */
export const getCategoryById = async (id: string): Promise<ServiceCategory | null> => {
    const pool = db.getPool();
    const query = `
        SELECT ${COLUMNS}
        FROM services_categories 
        WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca una categoría por nombre.
 */
export const getCategoryByName = async (name: string): Promise<ServiceCategory | null> => {
    const pool = db.getPool();
    const query = `
        SELECT ${COLUMNS}
        FROM services_categories 
        WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [name]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Inserta una nueva categoría.
 */
export const createCategory = async (data: CreateServiceCategoryInput): Promise<ServiceCategory> => {
    const pool = db.getPool();
    const query = `
        INSERT INTO services_categories (name, description, is_active)
        VALUES ($1, $2, $3)
        RETURNING ${COLUMNS}
    `;
    const values = [
        data.name, 
        data.description ?? null, 
        data.isActive !== undefined ? data.isActive : true
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Actualiza los campos especificados de una categoría.
 */
export const updateCategory = async (id: string, fields: UpdateServiceCategoryInput): Promise<ServiceCategory> => {
    const pool = db.getPool();
    const columnByField: [keyof UpdateServiceCategoryInput, string][] = [
        ['name', 'name'],
        ['description', 'description'],
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
        const existing = await getCategoryById(id);
        if (!existing) throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
        return existing;
    }

    values.push(id);
    const query = `
        UPDATE services_categories
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length}
        RETURNING ${COLUMNS}
    `;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }
    return result.rows[0];
};

/**
 * Elimina físicamente una categoría.
 */
export const deleteCategory = async (id: string): Promise<void> => {
    const pool = db.getPool();
    const query = `DELETE FROM services_categories WHERE id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Category not found');
    }
};