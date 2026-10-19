import db from '../connection/connection.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import type { Service } from '../types/entities/service.interface.js';
import type { CreateServiceRequest, UpdateServiceRequest } from '../types/dto/serviceRequest.interface.js';

export type CreateServiceInput = CreateServiceRequest;
export type UpdateServiceInput = UpdateServiceRequest;

export interface ServiceFilterOptions {
    categoryId?: string;
    isActive?: boolean;
}

const SERVICE_COLUMNS = `id, category_id, name, description, duration_minutes, price, is_active, created_at, updated_at`;

/**
 * Recupera el listado de servicios del catálogo con filtros opcionales.
 */
export const getAllServices = async (filters?: ServiceFilterOptions): Promise<Service[]> => {
    const pool = db.getPool();
    const whereClauses: string[] = [];
    const values: unknown[] = [];

    if (filters?.categoryId) {
        values.push(filters.categoryId);
        whereClauses.push(`category_id = $${values.length}`);
    }

    if (filters?.isActive !== undefined) {
        values.push(filters.isActive);
        whereClauses.push(`is_active = $${values.length}`);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `
        SELECT ${SERVICE_COLUMNS}
        FROM services
        ${whereString}
        ORDER BY name ASC
    `;

    const result = await pool.query(query, values);
    return result.rows;
};

/**
 * Recupera todos los servicios activos del catálogo.
 */
export const getActiveServices = async (): Promise<Service[]> => {
    return getAllServices({ isActive: true });
};

/**
 * Busca un servicio por su identificador único.
 */
export const getServiceById = async (id: string): Promise<Service | null> => {
    const pool = db.getPool();
    const query = `
        SELECT ${SERVICE_COLUMNS}
        FROM services
        WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Busca un servicio por su nombre exacto (insensible a mayúsculas y minúsculas).
 */
export const getServiceByName = async (name: string): Promise<Service | null> => {
    const pool = db.getPool();
    const query = `
        SELECT ${SERVICE_COLUMNS}
        FROM services
        WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [name]);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Inserta un nuevo servicio.
 */
export const createService = async (data: CreateServiceInput): Promise<Service> => {
    const pool = db.getPool();
    const query = `
        INSERT INTO services (category_id, name, description, duration_minutes, price, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ${SERVICE_COLUMNS}
    `;
    const values = [
        data.categoryId,
        data.name,
        data.description ?? null,
        data.durationMinutes,
        data.price,
        data.isActive !== undefined ? data.isActive : true,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Actualiza los campos especificados de un servicio existente.
 */
export const updateService = async (id: string, fields: UpdateServiceInput): Promise<Service> => {
    const pool = db.getPool();

    const columnByField: [keyof UpdateServiceInput, string][] = [
        ['categoryId', 'category_id'],
        ['name', 'name'],
        ['description', 'description'],
        ['durationMinutes', 'duration_minutes'],
        ['price', 'price'],
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
        const existing = await getServiceById(id);
        if (!existing) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');
        }
        return existing;
    }

    values.push(id);
    const query = `
        UPDATE services
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length}
        RETURNING ${SERVICE_COLUMNS}
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');
    }
    return result.rows[0];
};

/**
 * Realiza un borrado lógico del servicio marcando is_active = false.
 */
export const softDeleteService = async (id: string): Promise<Service> => {
    const pool = db.getPool();
    const query = `
        UPDATE services
        SET is_active = false
        WHERE id = $1
        RETURNING ${SERVICE_COLUMNS}
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Service not found');
    }
    return result.rows[0];
};
