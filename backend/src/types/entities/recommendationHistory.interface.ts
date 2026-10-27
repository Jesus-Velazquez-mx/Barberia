export interface RecommendationHistory {
    id: string;
    client_id: string;
    suggestion_text: string | null;
    confidence: number | null;
    reasoning: string | null;
    recommended_haircut_style_id: string | null;
    error_message: string | null;
    requested_at: Date;
    completed_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
