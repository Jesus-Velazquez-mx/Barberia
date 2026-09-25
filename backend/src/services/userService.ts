import bcrypt from 'bcrypt';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import { canUpdateUser } from './userPermissions.js';
import { getUserRoleById, updateUserById } from '../repositories/userRepository.js';
import type { UpdateUserInput } from '../repositories/userRepository.js';
import type { UserResponse } from '../types/dto/userResponse.interface.js';
import { toUserResponse } from '../utils/userMapper.js';

/**
 * Actualiza los datos compartidos (tabla users) del usuario objetivo, siempre que
 * el usuario autenticado por el token esté autorizado a hacerlo (ver userPermissions.ts).
 */
const updateUser = async (user: UpdateUserInput, token: string): Promise<UserResponse> => {
    const performer = decodeToken(token);

    const target = await getUserRoleById(user.id);
    if (!target) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'User not found');
    }

    if (!canUpdateUser(performer, target)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to update this user');
    }

    const fields: UpdateUserInput = { ...user };
    if (fields.password) {
        fields.password = await bcrypt.hash(fields.password, 10);
    }

    const updated = await updateUserById(fields);
    return toUserResponse(updated);
};

export { updateUser };
