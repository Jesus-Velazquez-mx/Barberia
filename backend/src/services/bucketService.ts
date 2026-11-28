import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import globalConfig from '../config/globalConfig.js';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { isUserSessionValid } from '../utils/userSession.js';
import {
    getHaircutImageExtension,
    getHaircutPhotoKey,
    getUserPhotoKey,
    HAIRCUT_IMAGE_EXTENSIONS,
    type HaircutImageContentType,
} from '../utils/photoKey.js';
import { fromEnv } from '@aws-sdk/credential-providers';
import { clearClientFacialStructure } from '../repositories/clientRepository.js';
import { getHaircutStyleById } from '../repositories/haircutRepository.js';
import { canManageHaircutStyles, type UserIdentity } from './userPermissions.js';

const HAIRCUT_IMAGE_URL_EXPIRES_IN = 300;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const PRESIGNED_POST_EXPIRES_IN = 120;

const isS3NotFound = (error: unknown): boolean => {
    const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    return e?.name === 'NotFound' || e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;
};

const client = new S3Client({
    region: globalConfig.AWS_REGION,
    credentials: fromEnv(),
});

/** Destino de la foto que se va a subir: la del cliente autenticado o la de catálogo de un corte. */
export type PresignedUploadTarget =
    { type: 'user' } | { type: 'haircut'; haircutId: string; contentType: HaircutImageContentType };

/** Indica si existe el objeto `key` en el bucket. */
const objectExists = async (key: string): Promise<boolean> => {
    try {
        await client.send(new HeadObjectCommand({ Bucket: globalConfig.AWS_BUCKET, Key: key }));
        return true;
    } catch (error) {
        if (isS3NotFound(error)) return false;
        throw error;
    }
};

const deleteObject = async (key: string): Promise<void> => {
    try {
        await client.send(new DeleteObjectCommand({ Bucket: globalConfig.AWS_BUCKET, Key: key }));
    } catch (error) {
        if (!isS3NotFound(error)) throw error;
    }
};

const generateUserPresignedURL = async (performer: UserIdentity) => {
    if (performer.role !== 'client') {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'This feature is only available for clients');
    }

    const presignedPost = await createPresignedPost(client, {
        Bucket: globalConfig.AWS_BUCKET,
        Key: getUserPhotoKey(performer.id),
        Conditions: [
            ['starts-with', '$Content-Type', 'image/'],
            ['content-length-range', 0, MAX_IMAGE_SIZE],
        ],
        Expires: PRESIGNED_POST_EXPIRES_IN,
    });

    // Cada usuario tiene una sola foto y subir una nueva reemplaza la anterior, así que la estructura facial
    // guardada deja de ser confiable: se descarta para que la siguiente recomendación la detecte de nuevo.
    await clearClientFacialStructure(performer.id);

    return presignedPost;
};

const generateHaircutPresignedURL = async (
    performer: UserIdentity,
    haircutId: string,
    contentType: HaircutImageContentType
) => {
    if (!canManageHaircutStyles(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to upload haircut images');
    }

    const haircut = await getHaircutStyleById(haircutId);
    if (!haircut) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut not found');
    }

    const extension = getHaircutImageExtension(contentType);

    // La foto se busca por extensión (jpg, png, webp, en ese orden): si quedara una versión con otra extensión,
    // podría encontrarse antes que la nueva. Se eliminan para que la foto subida sea la única del corte.
    for (const other of HAIRCUT_IMAGE_EXTENSIONS) {
        if (other !== extension) await deleteObject(getHaircutPhotoKey(haircut.name, other));
    }

    return createPresignedPost(client, {
        Bucket: globalConfig.AWS_BUCKET,
        Key: getHaircutPhotoKey(haircut.name, extension),
        Conditions: [
            ['eq', '$Content-Type', contentType],
            ['content-length-range', 0, MAX_IMAGE_SIZE],
        ],
        Expires: PRESIGNED_POST_EXPIRES_IN,
    });
};

/**
 * Formulario prefirmado (POST) para subir una foto directamente a S3.
 * - `user` (por defecto): foto del cliente autenticado; solo clientes.
 * - `haircut`: foto de catálogo de un corte; solo managers. Reemplaza la foto anterior del corte.
 */
export const generatePresignedURL = async (token: string, target: PresignedUploadTarget = { type: 'user' }) => {
    const performer = await isUserSessionValid(token);

    if (target.type === 'haircut') {
        return generateHaircutPresignedURL(performer, target.haircutId, target.contentType);
    }

    return generateUserPresignedURL(performer);
};

/**
 * Mueve la foto de catálogo de un corte cuando cambia su nombre (la key se deriva del nombre).
 * Copia el objeto a la key nueva y borra el anterior. Si el corte no tiene foto, no hace nada.
 */
export const moveHaircutPhoto = async (oldName: string, newName: string): Promise<void> => {
    for (const extension of HAIRCUT_IMAGE_EXTENSIONS) {
        const oldKey = getHaircutPhotoKey(oldName, extension);
        const newKey = getHaircutPhotoKey(newName, extension);

        if (oldKey === newKey || !(await objectExists(oldKey))) continue;

        await client.send(
            new CopyObjectCommand({
                Bucket: globalConfig.AWS_BUCKET,
                CopySource: `${globalConfig.AWS_BUCKET}/${encodeURIComponent(oldKey)}`,
                Key: newKey,
            })
        );
        await deleteObject(oldKey);
    }
};

export interface HaircutImageURL {
    url: string;
    expiresIn: number;
}

/**
 * URL prefirmada (GET) de la foto de catálogo de un corte. Es pública: no requiere sesión.
 * La extensión real (jpg, png o webp) se descubre consultando el bucket con HeadObject.
 */
export const generateHaircutImageURL = async (haircutId: string): Promise<HaircutImageURL> => {
    const haircut = await getHaircutStyleById(haircutId);

    if (!haircut) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut not found');
    }

    for (const extension of HAIRCUT_IMAGE_EXTENSIONS) {
        const key = getHaircutPhotoKey(haircut.name, extension);

        if (!(await objectExists(key))) continue;

        const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: globalConfig.AWS_BUCKET, Key: key }), {
            expiresIn: HAIRCUT_IMAGE_URL_EXPIRES_IN,
        });

        return { url, expiresIn: HAIRCUT_IMAGE_URL_EXPIRES_IN };
    }

    throw new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut image not found');
};
