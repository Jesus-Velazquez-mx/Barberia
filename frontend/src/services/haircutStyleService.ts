import { apiClient } from './apiClient';
import { uploadPhotoToS3 } from './recommendationService';
import type { PresignedUploadForm } from '../types/recommendation';
import type {
    FacialStructure,
    HaircutImageContentType,
    HaircutStyle,
    HaircutStylePayload
} from '../types/haircutStyleType';

/*
 * Servicio del catálogo de estilos de corte (solo manager).
 *
 *   getHaircutStyles      -> GET    /haircuts                       (activos e inactivos)
 *   getFacialStructures   -> GET    /haircuts/facial-structures     (valores válidos, desde la BD)
 *   createHaircutStyle    -> POST   /haircuts
 *   updateHaircutStyle    -> PUT    /haircuts/:id                   (al renombrar, el backend mueve la foto)
 *   deleteHaircutStyle    -> DELETE /haircuts/:id                   (borrado lógico)
 *   uploadHaircutPhoto    -> GET    /presigned-url?target=haircut   + POST directo a S3
 *
 * La foto de cada estilo se consulta con getHaircutImageUrl (services/recommendationService.ts).
 * Los errores llegan en inglés; utils/haircutStyleUtils.ts los traduce.
 */

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getHaircutStyles = async (token: string): Promise<HaircutStyle[]> => {
    const response = await apiClient.get<HaircutStyle[]>('/haircuts', { headers: authHeaders(token) });
    return response.data;
};

export const getFacialStructures = async (token: string): Promise<FacialStructure[]> => {
    const response = await apiClient.get<FacialStructure[]>('/haircuts/facial-structures', {
        headers: authHeaders(token)
    });
    return response.data;
};

export const createHaircutStyle = async (payload: HaircutStylePayload, token: string): Promise<HaircutStyle> => {
    const response = await apiClient.post<HaircutStyle>('/haircuts', payload, { headers: authHeaders(token) });
    return response.data;
};

export const updateHaircutStyle = async (
    id: string,
    payload: HaircutStylePayload,
    token: string
): Promise<HaircutStyle> => {
    const response = await apiClient.put<HaircutStyle>(`/haircuts/${id}`, payload, { headers: authHeaders(token) });
    return response.data;
};

export const deleteHaircutStyle = async (id: string, token: string): Promise<void> => {
    await apiClient.delete(`/haircuts/${id}`, { headers: authHeaders(token) });
};

/*
 * Sube (o reemplaza) la foto de catálogo de un estilo: pide el formulario presignado y lo envía a S3.
 * El formulario caduca en 2 minutos y exige que el archivo tenga exactamente el Content-Type indicado.
 */
export const uploadHaircutPhoto = async (haircutId: string, photo: File, token: string): Promise<void> => {
    const query = new URLSearchParams({
        target: 'haircut',
        haircutId,
        contentType: photo.type as HaircutImageContentType
    });
    const response = await apiClient.get<PresignedUploadForm>(`/presigned-url?${query.toString()}`, {
        headers: authHeaders(token)
    });

    await uploadPhotoToS3(response.data, photo);
};
