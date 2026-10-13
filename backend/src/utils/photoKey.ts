import globalConfig from '../config/globalConfig.js';

/**
 * Key de la foto de un usuario en el bucket de S3.
 *
 * Se deriva del id del usuario autenticado y nunca de un valor enviado por el
 * cliente: la URL prefirmada de subida y el microservicio de IA (que lee el
 * bucket con sus propias credenciales) deben apuntar siempre al mismo objeto,
 * y un usuario no puede pedir que se analice la foto de otro.
 */
export const getUserPhotoKey = (userId: string): string => globalConfig.AWS_BUCKET_KEY_PREFIX + userId;
