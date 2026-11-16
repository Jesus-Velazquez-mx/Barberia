import type { ClientPayload, ClientRecord } from '../types/clientType';
import { apiClient } from './apiClient';

interface ClientApi {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    birthDate: string;
    gender: string;
    completedServicesCount: number;
}

const authHeaders = (token: string): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } });

const toClientRecord = (client: ClientApi): ClientRecord => ({
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    birthDate: client.birthDate ? client.birthDate.slice(0, 10) : '',
    gender: client.gender,
    completedServicesCount: client.completedServicesCount
});

/* Obtiene todos los clientes registrados (solo manager o receptionist). */
export const getClients = async (token: string): Promise<ClientRecord[]> => {
    const { data } = await apiClient.get<ClientApi[]>('/clients', authHeaders(token));
    return data.map(toClientRecord);
};

/* Solo personal (manager o receptionist). Coincidencia parcial en nombre, apellido o correo; el backend devuelve máx. 20. */
export const searchClients = async (term: string, token: string): Promise<ClientRecord[]> => {
    const params = new URLSearchParams({ q: term });
    const { data } = await apiClient.get<ClientApi[]>(`/clients?${params}`, authHeaders(token));
    return data.map(toClientRecord);
};

/* Registra un nuevo cliente desde el panel del manager o recepcionista. */
export const createClient = async (payload: ClientPayload, token: string): Promise<ClientRecord> => {
    const { data } = await apiClient.post<ClientApi>(
        '/clients',
        {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            birthDate: payload.birthDate,
            gender: payload.gender,
            password: payload.password
        },
        authHeaders(token)
    );
    return toClientRecord(data);
};

/* Actualiza los datos personales de un cliente existente. */
export const updateClient = async (id: string, payload: ClientPayload, token: string): Promise<ClientRecord> => {
    const { data } = await apiClient.put<ClientApi>(
        `/clients/${id}`,
        {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            birthDate: payload.birthDate,
            gender: payload.gender
        },
        authHeaders(token)
    );
    return toClientRecord(data);
};

/* Elimina físicamente la cuenta de un cliente. */
export const deleteClient = async (id: string, token: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`, authHeaders(token));
};
