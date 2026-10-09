import db from '../connection/connection.js';
import type { FacialStructureType } from '../types/entities/client.interface.js';
import type { HaircutStyle } from '../types/entities/haircutStyle.interface.js';

export const getActiveHaircutStyles = async (): Promise<HaircutStyle[] | null> => {
    const pool = db.getPool();

    const query = 'SELECT * FROM haircut_styles WHERE is_active = true';

    const result = await pool.query(query);
    return result.rows.length ? (result.rows as HaircutStyle[]) : null;
};

export const getActiveHaircutStylesByFacialStructure = async (facialStructure: FacialStructureType) => {
    const pool = db.getPool();

    const query = `
        SELECT hs.id, hs.name, hs.description, hs.is_active, hs.created_at, hs.updated_at 
        FROM haircut_style_facial_structures hsfs
        INNER JOIN haircut_styles hs ON hs.id = hsfs.haircut_style_id
        WHERE hs.is_active = true AND hsfs.facial_structure_type = $1
    `;

    const result = await pool.query(query, [facialStructure]);
    return result.rows.length ? (result.rows as HaircutStyle[]) : null;
};
