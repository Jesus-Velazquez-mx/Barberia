import db from '../connection/connection.js';
import type { RecommendationHistory } from '../types/entities/recommendationHistory.interface.js';

export interface CreateRecommendationHistoryParams {
    clientId: string;
    suggestionText?: string | null;
    /** Porcentaje (0-100) con dos decimales, como lo almacena la columna `numeric(5,2)`. */
    confidence?: number | null;
    reasoning?: string | null;
    recommendedHaircutStyleId?: string | null;
    errorMessage?: string | null;
    requestedAt: Date;
    completedAt: Date;
}

/**
 * Guarda en el historial el resultado de una solicitud de recomendación: una recomendación, un
 * "ningún corte aplica" o un error. Los campos que no aplican al resultado se guardan como NULL.
 */
export const createRecommendationHistory = async ({
    clientId,
    suggestionText = null,
    confidence = null,
    reasoning = null,
    recommendedHaircutStyleId = null,
    errorMessage = null,
    requestedAt,
    completedAt,
}: CreateRecommendationHistoryParams): Promise<RecommendationHistory> => {
    const pool = db.getPool();

    const result = await pool.query(
        `INSERT INTO recommendation_history
            (client_id, suggestion_text, confidence, reasoning, recommended_haircut_style_id, error_message, requested_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [clientId, suggestionText, confidence, reasoning, recommendedHaircutStyleId, errorMessage, requestedAt, completedAt]
    );

    return result.rows[0] as RecommendationHistory;
};
