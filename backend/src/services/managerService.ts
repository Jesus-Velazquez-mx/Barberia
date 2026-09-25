import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import { canUpdateManagerTitle } from './userPermissions.js';
import { updateManagerTitleById } from '../repositories/managerRepository.js';
import type { ManagerResponse } from '../types/dto/managerResponse.interface.js';
import { toManagerResponse } from '../utils/userMapper.js';

export interface UpdateManagerRequest {
    id: string;
    title: string;
}

/**
 * Actualiza el título del manager objetivo, siempre que el usuario autenticado por
 * el token esté autorizado a hacerlo (ver userPermissions.ts).
 */
const updateManager = async (target: UpdateManagerRequest, token: string): Promise<ManagerResponse> => {
    const performer = decodeToken(token);

    if (!canUpdateManagerTitle(performer, target.id)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to update this manager');
    }

    const updated = await updateManagerTitleById({ userId: target.id, title: target.title });

    return toManagerResponse(updated);
};

export { updateManager };
