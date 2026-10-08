import jwt from 'jsonwebtoken';
import type { User, UserRole } from '../types/entities/user.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import globalConfig from '../config/globalConfig.js';

export type TokenPayload = jwt.JwtPayload & {
    id: string;
    role: UserRole;
    email: string;
};

const signToken = (user: User) => {
    return jwt.sign({ id: user.id, role: user.role, email: user.email }, globalConfig.JWT_SECRET, { expiresIn: '8h' });
};

const decodeToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, globalConfig.JWT_SECRET) as TokenPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
            throw new ApiError(ApiErrorCode.UNAUTHORIZED, error.message);
        }
        throw error;
    }
};

export { signToken, decodeToken };
