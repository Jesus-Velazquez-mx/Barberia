import { ApiError } from '../types/api';
import { getApiErrorMessage } from './apiErrorUtils';

/* Valor de los filtros que representa "sin filtro". */
export const SUPPLY_FILTER_ALL = 'all';

/* Convierte los errores del backend de insumos (en inglés) en mensajes en español. */
export function getSupplyErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.status === 403) return 'No tienes permiso para administrar los suministros.';
        if (error.status === 404) return 'El suministro, la sucursal o la categoría ya no existe. Actualiza la lista.';
        if (error.status === 409) {
            return error.message.includes('SKU')
                ? 'Ya existe un suministro con ese SKU en esta sucursal.'
                : 'Ya existe un suministro con ese nombre en esta sucursal.';
        }
    }

    return getApiErrorMessage(error, fallback);
}
