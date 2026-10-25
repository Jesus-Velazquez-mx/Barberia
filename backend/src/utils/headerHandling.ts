import type { Request } from 'express';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';

export const extractBearerFromHeader = (req: Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(ApiErrorCode.UNAUTHORIZED, 'Missing or invalid authorization token');
    }
    return authHeader.split(' ')[1];
};

/**
 * Para endpoints públicos con contenido dependiente del rol: sin encabezado
 * Authorization devuelve undefined (usuario anónimo); con un encabezado mal
 * formado lanza 401 igual que extractBearerFromHeader.
 */
export const extractOptionalBearerFromHeader = (req: Request): string | undefined => {
    if (!req.headers.authorization) {
        return undefined;
    }
    return extractBearerFromHeader(req);
};
