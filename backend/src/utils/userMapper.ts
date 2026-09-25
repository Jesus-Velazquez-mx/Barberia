import type { User } from '../types/entities/user.interface.js';
import type { Barber } from '../types/entities/barber.interface.js';
import type { Manager } from '../types/entities/manager.interface.js';
import type { Receptionist } from '../types/entities/receptionist.interface.js';
import type { Client } from '../types/entities/client.interface.js';
import type { UserResponse } from '../types/dto/userResponse.interface.js';
import type { BarberResponse } from '../types/dto/barberResponse.interface.js';
import type { ManagerResponse } from '../types/dto/managerResponse.interface.js';
import type { ReceptionistResponse } from '../types/dto/receptionistResponse.interface.js';
import type { ClientResponse } from '../types/dto/clientResponse.interface.js';

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

export const toBarberResponse = (barber: Barber): BarberResponse => ({
    userId: barber.user_id,
    shopId: barber.shop_id,
    shiftId: barber.shift_id,
    bio: barber.bio,
    isAcceptingBookings: barber.is_accepting_bookings
});

export const toManagerResponse = (manager: Manager): ManagerResponse => ({
    userId: manager.user_id,
    title: manager.title
});

export const toReceptionistResponse = (receptionist: Receptionist): ReceptionistResponse => ({
    userId: receptionist.user_id,
    shopId: receptionist.shop_id,
    shiftId: receptionist.shift_id
});

export const toClientResponse = (client: Client): ClientResponse => ({
    userId: client.user_id,
    facialStructureType: client.facial_structure_type,
    completedServicesCount: client.completed_services_count
});

// The *Profile mappers below are used to nest role data inside `user` in
// AuthResponse, where userId is redundant with the already-present user.id.

export const toBarberProfile = (barber: Barber): Omit<BarberResponse, 'userId'> => ({
    shopId: barber.shop_id,
    shiftId: barber.shift_id,
    bio: barber.bio,
    isAcceptingBookings: barber.is_accepting_bookings
});

export const toManagerProfile = (manager: Manager): Omit<ManagerResponse, 'userId'> => ({
    title: manager.title
});

export const toReceptionistProfile = (receptionist: Receptionist): Omit<ReceptionistResponse, 'userId'> => ({
    shopId: receptionist.shop_id,
    shiftId: receptionist.shift_id
});

export const toClientProfile = (client: Client): Omit<ClientResponse, 'userId'> => ({
    facialStructureType: client.facial_structure_type,
    completedServicesCount: client.completed_services_count
});
