import bcrypt from 'bcrypt';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { decodeToken } from './jwtTokenService.js';
import { isUserActive } from '../repositories/userRepository.js';
import {
    createClient,
    getClientById,
    getClientByEmail,
    getClientsByName,
    getAllClients,
    updateClientById,
    deleteClientById,
} from '../repositories/clientRepository.js';
import type { FacialStructureType } from '../types/entities/client.interface.js';
import type { ClientDetailResponse } from '../types/dto/clientResponse.interface.js';
import { toClientDetailResponse } from '../utils/userMapper.js';

export interface CreateClientDTO {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string | null;
    birthDate: Date;
    gender: string;
    facialStructureType?: FacialStructureType | null;
    completedServicesCount?: number;
}

export interface UpdateClientDTO {
    id: string;
    email?: string;
    phone?: string | null;
    password?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: Date;
    gender?: string;
    facialStructureType?: FacialStructureType | null;
    completedServicesCount?: number;
}

/**
 * Registra un nuevo cliente en el sistema.
 * Si se envía un token, se verifica que sea personal autorizado (manager o receptionist).
 * Si no se envía token, se permite el auto-registro.
 */
export const registerClient = async ( data: CreateClientDTO, token?: string): Promise<ClientDetailResponse> => {
    if (token) {
        const actor = decodeToken(token);
        if (!(await isUserActive(actor.id))) {
            throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
        }
        if (actor.role === 'client') {
            throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: Clients cannot create other client accounts');
        }
    }

    const password_hash = await bcrypt.hash(data.password, 10);

    const created = await createClient({
        email: data.email,
        phone: data.phone ?? null,
        password_hash,
        first_name: data.firstName,
        last_name: data.lastName,
        birth_date: data.birthDate,
        gender: data.gender,
        facial_structure_type: data.facialStructureType ?? null,
        completed_services_count: data.completedServicesCount ?? 0,
    });

    return toClientDetailResponse(created);
};

/**
 * Lista todos los clientes registrados.
 * Solo accesible para el personal (manager y receptionist).
 */
export const listClients = async (token: string): Promise<ClientDetailResponse[]> => {
    const actor = decodeToken(token);
    if (!(await isUserActive(actor.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    if (actor.role !== 'manager' && actor.role !== 'receptionist') {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: Only staff can list clients');
    }

    const clients = await getAllClients();
    return clients.map(toClientDetailResponse);
};

/**
 * Obtiene los detalles de un cliente por su ID.
 * Un cliente solo puede ver su propio perfil; el personal puede ver el de cualquier cliente.
 */
export const getClientDetails = async (id: string, token: string): Promise<ClientDetailResponse> => {
    const actor = decodeToken(token);
    if (!(await isUserActive(actor.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const isSelf = actor.id === id;
    const isStaff = actor.role === 'manager' || actor.role === 'receptionist';

    if (!isSelf && !isStaff) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: You do not have permission to view this client');
    }

    const client = await getClientById(id);
    if (!client) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client not found');
    }

    return toClientDetailResponse(client);
};

/**
 * Obtiene los detalles de un cliente por su correo electrónico.
 * Un cliente solo puede consultar su propio perfil; el personal puede consultar el de cualquier cliente.
 */
export const getClientDetailsByEmail = async (email: string, token: string): Promise<ClientDetailResponse> => {
    const actor = decodeToken(token);
    if (!(await isUserActive(actor.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const client = await getClientByEmail(email);
    if (!client) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client not found');
    }

    const isSelf = actor.id === client.id;
    const isStaff = actor.role === 'manager' || actor.role === 'receptionist';

    if (!isSelf && !isStaff) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: You do not have permission to view this client');
    }

    return toClientDetailResponse(client);
};

/**
 * Busca clientes por nombre o apellido.
 * Solo accesible para el personal (manager y receptionist).
 */
export const searchClientsByName = async (name: string, token: string): Promise<ClientDetailResponse[]> => {
    const actor = decodeToken(token);
    if (!(await isUserActive(actor.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    if (actor.role !== 'manager' && actor.role !== 'receptionist') {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: Only staff can search clients by name');
    }

    const clients = await getClientsByName(name);
    return clients.map(toClientDetailResponse);
};


/**
 * Actualiza los datos de un cliente.
 * Un cliente puede actualizar su propio perfil; el personal (manager y receptionist) puede actualizar cualquier cliente.
 * Solo el personal puede modificar 'completedServicesCount'.
 */
export const updateClient = async ( fields: UpdateClientDTO, token: string): Promise<ClientDetailResponse> => {
    
    const actor = decodeToken(token);
    if (!(await isUserActive(actor.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const target = await getClientById(fields.id);
    if (!target) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client not found');
    }

    const isSelf = actor.id === fields.id;
    const isStaff = actor.role === 'manager' || actor.role === 'receptionist';

    if (!isSelf && !isStaff) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: You do not have permission to update this client');
    }

    if (!isStaff && fields.completedServicesCount !== undefined) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: Clients cannot modify completed services count');
    }

    const updateData: UpdateClientDTO = { ...fields };
    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updated = await updateClientById(updateData);
    return toClientDetailResponse(updated);
};

/**
 * Elimina físicamente a un cliente por su ID.
 * Un cliente puede eliminar su propia cuenta; los managers pueden eliminar cualquier cuenta de cliente.
 */
export const deleteClient = async (id: string, token: string): Promise<void> => {
    const actor = decodeToken(token);
    if (!(await isUserActive(actor.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }

    const target = await getClientById(id);
    if (!target) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client not found');
    }

    const isSelf = actor.id === id;
    const isManager = actor.role === 'manager';

    if (!isSelf && !isManager) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Forbidden: You do not have permission to delete this account');
    }

    await deleteClientById(id);
};
