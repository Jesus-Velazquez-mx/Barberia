import { GetObjectCommand, HeadObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import globalConfig from '../config/globalConfig.js';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { getHaircutPhotoKey, getUserPhotoKey, HAIRCUT_IMAGE_EXTENSIONS } from '../utils/photoKey.js';
import { fromEnv } from '@aws-sdk/credential-providers';
import { clearClientFacialStructure } from '../repositories/clientRepository.js';
import { getHaircutStyleById } from '../repositories/haircutRepository.js';

const HAIRCUT_IMAGE_URL_EXPIRES_IN = 300;

const isS3NotFound = (error: unknown): boolean => {
    const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    return e?.name === 'NotFound' || e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;
};

const client = new S3Client({
    region: globalConfig.AWS_REGION,
    credentials: fromEnv(),
});

export const generatePresignedURL = async (token: string) => {
    const performer = await isUserSessionValid(token);

    if (performer.role !== 'client') {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'This feature is only available for clients');
    }

    const presignedPost = await createPresignedPost(client, {
        Bucket: globalConfig.AWS_BUCKET,
        Key: getUserPhotoKey(performer.id),
        Conditions: [
            ['starts-with', '$Content-Type', 'image/'],
            ['content-length-range', 0, 5 * 1024 * 1024],
        ],
        Expires: 120,
    });

    // Cada usuario tiene una sola foto y subir una nueva reemplaza la anterior, así que la estructura facial
    // guardada deja de ser confiable: se descarta para que la siguiente recomendación la detecte de nuevo.
    await clearClientFacialStructure(performer.id);

    return presignedPost;
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

        try {
            await client.send(new HeadObjectCommand({ Bucket: globalConfig.AWS_BUCKET, Key: key }));
        } catch (error) {
            if (isS3NotFound(error)) continue;
            throw error;
        }

        const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: globalConfig.AWS_BUCKET, Key: key }), {
            expiresIn: HAIRCUT_IMAGE_URL_EXPIRES_IN,
        });

        return { url, expiresIn: HAIRCUT_IMAGE_URL_EXPIRES_IN };
    }

    throw new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut image not found');
};

/** Borra la foto del cliente. Si no existe, S3 responde 204 igual. */
export const deleteUserPhoto = async (userId: string): Promise<void> => {
    await client.send(
        new DeleteObjectCommand({
            Bucket: globalConfig.AWS_BUCKET,
            Key: getUserPhotoKey(userId),
        })
    );
};
