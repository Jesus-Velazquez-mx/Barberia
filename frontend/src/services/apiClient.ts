import { ApiError, type ApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_IP = import.meta.env.VITE_API_IP;

/* Cuerpo completo de la respuesta, con `data` ya tipado como T */
export type ApiClientResponse<T> = Omit<ApiResponse<T>, 'data'> & { data: T };

async function request<T>(path: string, options: RequestInit = {}, useRawIP: boolean = false): Promise<ApiClientResponse<T>> {
    let response: Response;

    const baseURL = useRawIP ? `${API_BASE_IP}/api` : API_BASE_URL;

    try {
        response = await fetch(`${baseURL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    } catch {
        throw new ApiError('Network error — could not reach the API', 0);
    }

    const body: ApiResponse<T> | undefined = await response.json().catch(() => undefined);

    if (!response.ok || body?.error || !body ) {
        const errors = body?.error ?? [];
        const message = body?.message || errors[0] || `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, errors);
    }

    return { data: body?.data as T, message: body.message };
}

export const apiClient = {
    get: <T>(path: string, init?: RequestInit, useRawIP?: boolean) => request<T>(path, init, useRawIP),
    post: <T>(path: string, body?: unknown, init?: RequestInit, useRawIP?: boolean) =>
        request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }, useRawIP),
    put: <T>(path: string, body?: unknown, init?: RequestInit, useRawIP?: boolean) =>
        request<T>(path, { ...init, method: 'PUT', body: JSON.stringify(body) }, useRawIP),
    delete: <T>(path: string, init?: RequestInit, useRawIP?: boolean) => request<T>(path, { ...init, method: 'DELETE' }, useRawIP)
};
