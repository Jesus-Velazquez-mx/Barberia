import globalConfig from '../config/globalConfig.js';

/**
 * Key de la foto de un usuario en el bucket de S3.
 *
 * Se deriva del id del usuario autenticado y nunca de un valor enviado por el
 * cliente: la URL prefirmada de subida y el microservicio de IA (que lee el
 * bucket con sus propias credenciales) deben apuntar siempre al mismo objeto,
 * y un usuario no puede pedir que se analice la foto de otro.
 */
export const getUserPhotoKey = (userId: string): string => globalConfig.AWS_BUCKET_KEY_PREFIX_USER + userId;

export const HAIRCUT_IMAGE_EXTENSIONS = ['jpg', 'png', 'webp'] as const;
export type HaircutImageExtension = (typeof HAIRCUT_IMAGE_EXTENSIONS)[number];

/**
 * Convierte un nombre a snake_case ("Wolf Cut" -> "wolf_cut"). El resultado solo contiene [a-z0-9_],
 * por lo que no puede usarse para salirse del prefijo del bucket.
 */
export const toSnakeCase = (name: string): string =>
    name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

/** Key de la foto de catálogo de un corte: `<prefijo de cortes><nombre en snake_case>.<extensión>`. */
export const getHaircutPhotoKey = (haircutName: string, extension: HaircutImageExtension): string =>
    `${globalConfig.AWS_BUCKET_KEY_PREFIX_HAIRCUTS}${toSnakeCase(haircutName)}.${extension}`;
