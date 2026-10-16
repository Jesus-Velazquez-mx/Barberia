import { apiClient } from './apiClient';
import type { HaircutRecommendation } from '../types/recommendation';

/* GET /recommendations?clientId=... => historial del cliente, de la más reciente a la más antigua. */
export const getRecommendationHistory = async (clientId: string, token: string): Promise<HaircutRecommendation[]> =>
    apiClient.get<HaircutRecommendation[]>(`/recommendations?clientId=${encodeURIComponent(clientId)}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
