import type { ClientPayload, ClientRecord } from '../types/clientType';
import { mockCreateClient, mockDeleteClient, mockListClients, mockUpdateClient } from '../mocks/adminMock';
import { apiClient } from './apiClient';

/*
 * Servicio de clientes.
 * Salvo searchClients (ya conectada al backend), hoy responde con datos mock. Para integrar con el backend
 * solo cambia el cuerpo de estas funciones (usando apiClient y el token); los contenedores no se tocan:
 *
 *   getClients    -> GET    /clients      (pendiente en el backend)
 *   createClient  -> POST   /clients      (pendiente; el registro actual exige contraseña, fecha de nacimiento y género)
 *   updateClient  -> PUT    /users        (existe: nombre, correo, teléfono)
 *   deleteClient  -> DELETE /users/:id    (existe; para clientes es borrado físico)
 */

export const getClients = async (_token: string): Promise<ClientRecord[]> => mockListClients();

/* Solo personal (manager o receptionist). Coincidencia parcial en nombre, apellido o correo; el backend devuelve máx. 20. */
export const searchClients = async (term: string, token: string): Promise<ClientRecord[]> => {
    const params = new URLSearchParams({ q: term });
    const { data } = await apiClient.get<ClientRecord[]>(`/clients?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data;
};

export const createClient = async (payload: ClientPayload, _token: string): Promise<ClientRecord> =>
    mockCreateClient(payload);

export const updateClient = async (id: string, payload: ClientPayload, _token: string): Promise<ClientRecord> =>
    mockUpdateClient(id, payload);

export const deleteClient = async (id: string, _token: string): Promise<void> => mockDeleteClient(id);
