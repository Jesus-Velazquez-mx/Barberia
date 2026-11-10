import { ApiError } from '../types/api';
import { getApiErrorMessage } from './apiErrorUtils';

/* Valor de los filtros que representa "sin filtro". */
export const SERVICE_FILTER_ALL = 'all';

/* Opciones del filtro y del selector de estado (borrado lógico: is_active). */
export const SERVICE_STATUS_FILTER_OPTIONS = [
    { value: SERVICE_FILTER_ALL, label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
];

export const ACTIVE_SELECT_OPTIONS = [
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' }
];

/* true si el registro pasa el filtro de estado. */
export const matchesStatus = (isActive: boolean, filter: string): boolean =>
    filter === SERVICE_FILTER_ALL || (filter === 'active' ? isActive : !isActive);

/* 30 -> "30 min", 90 -> "1 h 30 min". */
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest} min`;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/* Convierte los errores del backend de servicios (en inglés) en mensajes en español. */
export function getOfferedServiceErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.status === 403) return 'No tienes permiso para administrar los servicios.';
        if (error.status === 404) {
            return /category/i.test(error.message)
                ? 'La categoría seleccionada ya no existe. Actualiza la lista.'
                : 'El servicio ya no existe. Actualiza la lista.';
        }
        if (error.status === 409) return 'Ya existe un servicio con ese nombre.';
    }

    return getApiErrorMessage(error, fallback);
}

/* Igual que getOfferedServiceErrorMessage, pero para las categorías de servicios. */
export function getServiceCategoryErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.status === 403) return 'No tienes permiso para administrar las categorías.';
        if (error.status === 404) return 'La categoría ya no existe. Actualiza la lista.';
        if (error.status === 409) return 'Ya existe una categoría con ese nombre.';
    }

    return getApiErrorMessage(error, fallback);
}
