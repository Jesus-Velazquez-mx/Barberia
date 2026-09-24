import jwt from 'jsonwebtoken';
import { User } from '../types/entities/user.interface.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { loadConfig } from '../config/globalConfig.js';

const signToken = (user: User) => {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        loadConfig().JWT_SECRET,
        { expiresIn: '8h' }
    );
}

const decodeToken = (token: string) => {
    try {
        jwt.verify(token, loadConfig().JWT_SECRET);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new ApiError(ApiErrorCode.UNAUTHORIZED, error.message);
        }
        throw error;
    }
}

export { signToken, decodeToken };
