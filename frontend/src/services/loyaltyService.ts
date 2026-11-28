import type { LoyaltyStatus } from '../types/loyaltyType';
import { apiClient } from './apiClient';

const authHeaders = (token: string): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } });

/* Un cliente solo puede consultar su propio estado; el personal (manager o receptionist), el de cualquier cliente. */
export const getLoyaltyStatus = async (token: string, clientId: string): Promise<LoyaltyStatus> => {
    const { data } = await apiClient.get<LoyaltyStatus>(`/clients/${clientId}/loyalty`, authHeaders(token));
    return data;
};
