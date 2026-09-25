import bcrypt from 'bcrypt';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import { canUpdateUser } from './userPermissions.js';
import { getUserRoleById, isUserActive, updateUserById, hardDeleteUser, softDeleteStaff } from '../repositories/userRepository.js';
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

    // Rechaza un token que aún es válido cuyo propietario (o destinatario) fue desactivado desde que fue emitido.
    if (!(await isUserActive(performer.id)) || !(await isUserActive(target.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
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

/**
 * Maneja la lógica de negocio para eliminar un usuario.
 * Aplica discriminación por roles para permitir o denegar la acción,
 * y decide entre borrado físico o lógico según el rol del usuario objetivo.
 */
const deleteUserById = async (targetId: string, token: string): Promise<void> => {
    // Decodifica el token para identificar al usuario que realiza la petición
    const actor = decodeToken(token);

    // Obtiene el rol del usuario que se intentará eliminar
    const targetUser = await getUserRoleById(targetId);
    if (!targetUser) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'User not found');
    }

    // Identificadores de autorización
    const isSelf = actor.id === targetId;
    const isManager = actor.role === 'manager';

    // Lógica de autorización: discriminación por roles
    if (!isSelf) {
        if (!isManager) {
            // Si no es el mismo usuario y no es un mánager, se deniega el acceso
            throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: You do not have permission to delete this account');
        } else if (targetUser.role === 'manager') {
            // Un mánager no puede eliminar a otro mánager
            throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: Managers cannot delete other managers');
        }
    }

    // Ejecuta el borrado correspondiente
    if (targetUser.role === 'client') {
        // Borrado físico: el ON DELETE CASCADE eliminará el registro en la tabla 'clients'
        await hardDeleteUser(targetId);
    } else {
        // Borrado lógico: marca el campo 'deleted_at' del miembro del staff
        await softDeleteStaff(targetId, targetUser.role);
    }
};

export { updateUser, getUserProfile, deleteUserById };
