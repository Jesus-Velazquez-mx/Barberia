import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { isUserActive } from '../repositories/userRepository.js';
import { decodeToken, type TokenPayload } from '../services/jwtTokenService.js';

export const isUserSessionValid = async (perfomerToken: string): Promise<TokenPayload> => {
    const performer = decodeToken(perfomerToken);

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    return performer;
};
