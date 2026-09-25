import bcrypt from 'bcrypt';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import { canUpdateUser } from './userPermissions.js';
import { getUserRoleById, updateUserById } from '../repositories/userRepository.js';
import type { UpdateUserInput } from '../repositories/userRepository.js';
import { getBarberByUserId } from '../repositories/barberRepository.js';
import { getManagerByUserId } from '../repositories/managerRepository.js';
import { getReceptionistByUserId } from '../repositories/receptionistRepository.js';
import { getClientByUserId } from '../repositories/clientRepository.js';
import type { User } from '../types/entities/user.interface.js';
import type { UserResponse } from '../types/dto/userResponse.interface.js';
import type { ProfileResponse } from '../types/dto/authResponse.interface.js';
import { toUserResponse, toBarberProfile, toManagerProfile, toReceptionistProfile, toClientProfile } from '../utils/userMapper.js';

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

/**
 * Obtiene los datos específicos del rol de un usuario (barbero, manager,
 * recepcionista o cliente) para complementar los datos compartidos de `users`.
 */
const getUserProfile = async (user: User): Promise<ProfileResponse> => {
    switch (user.role) {
        case 'barber': {
            const barber = await getBarberByUserId(user.id);
            if (!barber) {
                throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber profile not found');
            }
            return toBarberProfile(barber);
        }
        case 'manager': {
            const manager = await getManagerByUserId(user.id);
            if (!manager) {
                throw new ApiError(ApiErrorCode.NOT_FOUND, 'Manager profile not found');
            }
            return toManagerProfile(manager);
        }
        case 'receptionist': {
            const receptionist = await getReceptionistByUserId(user.id);
            if (!receptionist) {
                throw new ApiError(ApiErrorCode.NOT_FOUND, 'Receptionist profile not found');
            }
            return toReceptionistProfile(receptionist);
        }
        case 'client': {
            const client = await getClientByUserId(user.id);
            if (!client) {
                throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client profile not found');
            }
            return toClientProfile(client);
        }
    }
};

export { updateUser, getUserProfile };
