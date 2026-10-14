import { ApiError } from '../types/api';

/* Convierte cualquier error en un mensaje legible para mostrar al usuario. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof ApiError)) return fallback;

    if (error.status === 400 && error.errors.length > 0) {
        return error.errors
            .map((e: unknown) =>
                typeof e === 'string' ? e : ((e as { message?: string }).message ?? JSON.stringify(e))
            )
            .join(' ');
    }

    return error.message || fallback;
}
