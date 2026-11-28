import type { PoolClient } from 'pg';
import db from '../connection/connection.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import type { FacialStructureType } from '../types/entities/client.interface.js';
import type { HaircutStyleWithStructures } from '../types/entities/haircutStyle.interface.js';

export type CreateHaircutStyleInput = {
    name: string;
    description?: string | null;
    facialStructures: FacialStructureType[];
};

export type UpdateHaircutStyleInput = Partial<CreateHaircutStyleInput> & { isActive?: boolean };

export type HaircutStyleFilters = { search?: string; isActive?: boolean };

/*
 * Estilo con sus estructuras faciales agregadas en un arreglo. El LEFT JOIN conserva los estilos sin
 * estructuras (solo posibles con datos cargados a mano) y el FILTER evita que aparezcan como [NULL].
 */
const SELECT_STYLE = `
    SELECT hs.id, hs.name, hs.description, hs.is_active, hs.created_at, hs.updated_at,
           COALESCE(
               array_agg(hsfs.facial_structure_type ORDER BY hsfs.facial_structure_type)
                   FILTER (WHERE hsfs.facial_structure_type IS NOT NULL),
               '{}'
           )::text[] AS facial_structures
    FROM haircut_styles hs
    LEFT JOIN haircut_style_facial_structures hsfs ON hsfs.haircut_style_id = hs.id
`;

/* El cast a text[] es necesario: pg no convierte arreglos de un enum propio y los devolvería como '{oval,round}'. */
const toStyle = (row: Record<string, unknown>): HaircutStyleWithStructures =>
    row as unknown as HaircutStyleWithStructures;

/**
 * Recupera los estilos de corte, opcionalmente filtrados por texto (nombre o descripción) y estado.
 */
export const getStyles = async (filters: HaircutStyleFilters = {}): Promise<HaircutStyleWithStructures[]> => {
    const pool = db.getPool();
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.search) {
        values.push(`%${filters.search}%`);
        conditions.push(`(hs.name ILIKE $${values.length} OR hs.description ILIKE $${values.length})`);
    }

    if (filters.isActive !== undefined) {
        values.push(filters.isActive);
        conditions.push(`hs.is_active = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(`${SELECT_STYLE} ${where} GROUP BY hs.id ORDER BY hs.name ASC`, values);
    return result.rows.map(toStyle);
};

/**
 * Busca un estilo de corte por ID, con sus estructuras faciales.
 */
export const getStyleById = async (id: string, client?: PoolClient): Promise<HaircutStyleWithStructures | null> => {
    const executor = client ?? db.getPool();
    const result = await executor.query(`${SELECT_STYLE} WHERE hs.id = $1 GROUP BY hs.id`, [id]);
    return result.rows.length ? toStyle(result.rows[0]) : null;
};

/**
 * Nombres de todos los estilos (activos e inactivos), para validar duplicados.
 */
export const getStyleNames = async (): Promise<{ id: string; name: string }[]> => {
    const pool = db.getPool();
    const result = await pool.query('SELECT id, name FROM haircut_styles');
    return result.rows;
};

/**
 * Valores del enum facial_structure_type, en el orden en que se declararon.
 */
export const getFacialStructureTypes = async (): Promise<FacialStructureType[]> => {
    const pool = db.getPool();
    const result = await pool.query('SELECT unnest(enum_range(NULL::facial_structure_type))::text AS value');
    return result.rows.map((row: { value: FacialStructureType }) => row.value);
};

const insertFacialStructures = async (client: PoolClient, styleId: string, structures: FacialStructureType[]) => {
    await client.query(
        `INSERT INTO haircut_style_facial_structures (haircut_style_id, facial_structure_type)
         SELECT $1, unnest($2::facial_structure_type[])`,
        [styleId, structures]
    );
};

/**
 * Inserta un estilo y sus estructuras faciales en una sola transacción.
 */
export const createStyle = async (data: CreateHaircutStyleInput): Promise<HaircutStyleWithStructures> => {
    const client = await db.getPool().connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            'INSERT INTO haircut_styles (name, description) VALUES ($1, $2) RETURNING id',
            [data.name, data.description ?? null]
        );
        const styleId: string = result.rows[0].id;
        await insertFacialStructures(client, styleId, data.facialStructures);

        const style = await getStyleById(styleId, client);
        await client.query('COMMIT');
        return style!;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Actualiza los campos indicados de un estilo y, si se envían, reemplaza sus estructuras faciales.
 * `beforeCommit` se ejecuta dentro de la transacción, justo antes del COMMIT: si falla, nada se guarda.
 */
export const updateStyle = async (
    id: string,
    fields: UpdateHaircutStyleInput,
    beforeCommit?: () => Promise<void>
): Promise<HaircutStyleWithStructures> => {
    const columnByField: [keyof UpdateHaircutStyleInput, string][] = [
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

    const client = await db.getPool().connect();

    try {
        await client.query('BEGIN');

        // Bloquea la fila: dos ediciones simultáneas no pueden mover la foto a la vez
        const locked = await client.query('SELECT id FROM haircut_styles WHERE id = $1 FOR UPDATE', [id]);
        if (locked.rows.length === 0) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut style not found');
        }

        if (setClauses.length > 0) {
            values.push(id);
            await client.query(
                `UPDATE haircut_styles SET ${setClauses.join(', ')} WHERE id = $${values.length}`,
                values
            );
        }

        if (fields.facialStructures) {
            await client.query('DELETE FROM haircut_style_facial_structures WHERE haircut_style_id = $1', [id]);
            await insertFacialStructures(client, id, fields.facialStructures);
        }

        const style = await getStyleById(id, client);

        if (beforeCommit) await beforeCommit();

        await client.query('COMMIT');
        return style!;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Baja lógica: marca el estilo como inactivo. Es idempotente.
 */
export const softDeleteStyle = async (id: string): Promise<void> => {
    const pool = db.getPool();
    const result = await pool.query('UPDATE haircut_styles SET is_active = false WHERE id = $1', [id]);
    if (result.rowCount === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut style not found');
    }
};
