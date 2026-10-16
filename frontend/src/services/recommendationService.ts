import { apiClient } from './apiClient';
import { ApiError } from '../types/api';
import type { GeneratedRecommendation, HaircutRecommendation, PresignedUploadForm } from '../types/recommendation';

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/* GET /recommendations?clientId=... => historial del cliente, de la más reciente a la más antigua. */
export const getRecommendationHistory = async (clientId: string, token: string): Promise<HaircutRecommendation[]> =>
    apiClient.get<HaircutRecommendation[]>(`/recommendations?clientId=${encodeURIComponent(clientId)}`, {
        headers: authHeaders(token)
    });

/*
 * GET /presigned-url => formulario firmado para subir la foto del cliente a S3.
 * Caduca en 2 minutos y, al pedirlo, el backend descarta la estructura facial guardada del cliente.
 */
export const getPresignedUploadForm = async (token: string): Promise<PresignedUploadForm> =>
    apiClient.get<PresignedUploadForm>('/presigned-url', { headers: authHeaders(token) });

/*
 * Sube la foto directamente a S3 con el formulario presignado. No pasa por apiClient: la petición va
 * a S3 (no al backend), es multipart/form-data y la respuesta no es JSON.
 * Reglas del backend: imagen (Content-Type image/*) de máximo 5 MB; la nueva foto reemplaza a la anterior.
 */
export const uploadPhotoToS3 = async (form: PresignedUploadForm, photo: File): Promise<void> => {
    const body = new FormData();

    // Los campos firmados van sin modificar y el Content-Type también debe viajar como campo del formulario
    Object.entries(form.fields).forEach(([name, value]) => body.append(name, value));
    body.append('Content-Type', photo.type);
    // S3 exige que el archivo sea el último campo
    body.append('file', photo);

    let response: Response;
    try {
        // Sin header Content-Type: el navegador lo genera con el boundary del multipart
        response = await fetch(form.url, { method: 'POST', body });
    } catch {
        throw new ApiError('Network error — could not upload the photo', 0);
    }

    if (!response.ok) {
        throw new ApiError(`Photo upload failed with status ${response.status}`, response.status);
    }
};

/* POST /recommendations/generate => la foto ya debe estar en S3; el backend deriva su key del usuario. */
export const generateRecommendation = async (
    userPreferences: string,
    token: string
): Promise<GeneratedRecommendation> => {
    const preferences = userPreferences.trim();

    return apiClient.post<GeneratedRecommendation>(
        '/recommendations/generate',
        { recommendationParams: preferences ? { userPreferences: preferences } : {} },
        { headers: authHeaders(token) }
    );
};

/*
 * Flujo completo de una recomendación nueva:
 *   1. pide el formulario presignado, 2. sube la foto a S3, 3. solicita la recomendación.
 * Cualquier paso que falle lanza un ApiError (usar getApiErrorMessage para mostrarlo).
 */
export const requestHaircutRecommendation = async (
    photo: File,
    userPreferences: string,
    token: string
): Promise<GeneratedRecommendation> => {
    const form = await getPresignedUploadForm(token);
    await uploadPhotoToS3(form, photo);
    return generateRecommendation(userPreferences, token);
};
