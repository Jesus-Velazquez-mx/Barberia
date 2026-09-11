export interface RecommendationHistory {
    id: string;
    client_id: string;
    photo_s3_key: string;
    suggestion_text: string | null;
    confidence: string | null; // numeric(5,2)
    error_message: string | null;
    requested_at: Date;
    completed_at: Date | null;
    created_at: Date;
    updated_at: Date;
}