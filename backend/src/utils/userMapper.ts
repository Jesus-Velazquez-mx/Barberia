import type { User } from '../types/entities/user.interface.js';
import type { UserResponse } from '../types/dto/userResponse.interface.js';

/**
 * Elimina el hash de la contraseña y traduce los campos snake_case de la base de
 * datos a camelCase antes de exponer el usuario en una respuesta.
 */
export const toUserResponse = (user: User): UserResponse => ({
    id: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    firstName: user.first_name,
    lastName: user.last_name,
    createdAt: user.created_at,
    updatedAt: user.updated_at
});
