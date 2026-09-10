import { ApiError, type ApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError('Network error — could not reach the API', 0);
  }

  const body: ApiResponse<T> | undefined = await response.json().catch(() => undefined);

  if (!response.ok || body?.error) {
    const errors = body?.error ?? [];
    const message = body?.message || errors[0] || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, errors);
  }

  return body?.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
