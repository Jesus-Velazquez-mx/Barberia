import type { Request } from "express";
import { ApiError, ApiErrorCode } from "../errors/ApiError.js";

export const extractBearerFromHeader = (req: Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(ApiErrorCode.UNAUTHORIZED, 'Missing or invalid authorization token');
    }
    return authHeader.split(' ')[1];
}