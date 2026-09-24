import jwt from 'jsonwebtoken';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';

export type UpdateUserInput = {
    id: string,
    email?: string,
    phone?: string,
    password?: string,
    firstName?: string,
    lastName?: string,
}

const updateUser = async (user: UpdateUserInput, token: string) => {
    try {
        // TODO
        return decodeToken(token);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new ApiError(ApiErrorCode.UNAUTHORIZED, error.message);
        }
    }
}

export { updateUser };