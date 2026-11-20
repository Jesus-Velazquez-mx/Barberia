import db from '../connection/connection.js';
import type { RecommendationHistory } from '../types/entities/recommendationHistory.interface.js';

export interface CreateRecommendationHistoryParams {
    clientId: string;
    suggestionText?: string | null;
    /** Porcentaje (0-100) con dos decimales, como lo almacena la columna `numeric(5,2)`. */
    confidence?: number | null;
    reasoning?: string | null;
    /** IDs de los cortes recomendados, en el orden en que los devolvió la IA (el primero es el mejor). */
    recommendedHaircutStyleIds?: string[];
    errorMessage?: string | null;
    requestedAt: Date;
    completedAt: Date;
}

/**
 * Guarda en el historial el resultado de una solicitud de recomendación: una recomendación, un
 * "ningún corte aplica" o un error. Los campos que no aplican al resultado se guardan como NULL, y los cortes
 * recomendados se guardan en `recommendation_history_haircut_styles` dentro de la misma transacción.
 */
export const createRecommendationHistory = async ({
    clientId,
    suggestionText = null,
    confidence = null,
    reasoning = null,
    recommendedHaircutStyleIds = [],
    errorMessage = null,
    requestedAt,
    completedAt,
}: CreateRecommendationHistoryParams): Promise<RecommendationHistory> => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO recommendation_history
                (client_id, suggestion_text, confidence, reasoning, error_message, requested_at, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [clientId, suggestionText, confidence, reasoning, errorMessage, requestedAt, completedAt]
        );
        const history = result.rows[0] as RecommendationHistory;

        // Un mismo corte no puede aparecer dos veces en una recomendación (llave primaria de la tabla de unión).
        const haircutStyleIds = [...new Set(recommendedHaircutStyleIds)];

        if (haircutStyleIds.length > 0) {
            await client.query(
                `INSERT INTO recommendation_history_haircut_styles (recommendation_history_id, haircut_style_id, position)
                 SELECT $1, t.haircut_style_id, t.ord - 1
                 FROM unnest($2::uuid[]) WITH ORDINALITY AS t(haircut_style_id, ord)`,
                [history.id, haircutStyleIds]
            );
        }

        await client.query('COMMIT');
        return history;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export type RecommendationHistoryWithHaircuts = RecommendationHistory & {
    /** Cortes recomendados en el orden de la IA; vacío si no se recomendó ninguno o todos fueron eliminados. */
    recommended_haircuts: { id: string; name: string }[];
};

/**
 * Historial de recomendaciones de un cliente, de la más reciente a la más antigua, con los cortes recomendados
 * (arreglo vacío si la solicitud no recomendó ninguno o los cortes fueron eliminados). Excluye las solicitudes que
 * fallaron (las que tienen `error_message`): solo incluye recomendaciones y "ningún corte aplica".
 */
export const getRecommendationHistoryByClientId = async (
    clientId: string
): Promise<RecommendationHistoryWithHaircuts[]> => {
    const pool = db.getPool();

    const result = await pool.query(
        `SELECT rh.*,
                COALESCE(
                    (SELECT json_agg(json_build_object('id', hs.id, 'name', hs.name) ORDER BY rhs.position)
                     FROM recommendation_history_haircut_styles rhs
                     JOIN haircut_styles hs ON hs.id = rhs.haircut_style_id
                     WHERE rhs.recommendation_history_id = rh.id),
                    '[]'::json
                ) AS recommended_haircuts
         FROM recommendation_history rh
         WHERE rh.client_id = $1 AND rh.error_message IS NULL
         ORDER BY rh.requested_at DESC`,
        [clientId]
    );

    return result.rows as RecommendationHistoryWithHaircuts[];
};
