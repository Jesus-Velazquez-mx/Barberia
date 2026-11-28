import { ApiError } from '../types/api';
import type { FacialStructure, HaircutImageContentType } from '../types/haircutStyleType';
import { getApiErrorMessage } from './apiErrorUtils';

/* Etiquetas en español de cada estructura facial. */
export const FACIAL_STRUCTURE_LABELS: Record<FacialStructure, string> = {
    oval: 'Ovalado',
    triangle: 'Triangular',
    heart: 'Corazón',
    round: 'Redondo',
    diamond: 'Diamante',
    square: 'Cuadrado',
    rectangle: 'Rectangular'
};

export const getFacialStructureLabel = (structure: FacialStructure): string =>
    FACIAL_STRUCTURE_LABELS[structure] ?? structure;

/* Reglas de la foto (espejo del backend): JPG, PNG o WEBP de máximo 5 MB. */
export const HAIRCUT_IMAGE_TYPES: HaircutImageContentType[] = ['image/jpeg', 'image/png', 'image/webp'];
export const HAIRCUT_IMAGE_ACCEPT = HAIRCUT_IMAGE_TYPES.join(',');
export const HAIRCUT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/* Devuelve el mensaje de error de la foto elegida, o null si es válida. */
export function validateHaircutImage(file: File): string | null {
    if (!HAIRCUT_IMAGE_TYPES.includes(file.type as HaircutImageContentType)) {
        return 'La foto debe ser JPG, PNG o WEBP.';
    }
    if (file.size > HAIRCUT_IMAGE_MAX_BYTES) return 'La foto no puede superar los 5 MB.';
    return null;
}

/* Convierte los errores del backend de estilos de corte (en inglés) en mensajes en español. */
export function getHaircutStyleErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.status === 403) return 'No tienes permiso para administrar los estilos de corte.';
        if (error.status === 404) return 'El estilo de corte ya no existe. Actualiza la lista.';
        if (error.status === 409) return 'Ya existe un estilo de corte con ese nombre.';
        if (error.status === 502) return 'No se pudo acceder al almacenamiento de fotos. Intenta más tarde.';
    }

    return getApiErrorMessage(error, fallback);
}
