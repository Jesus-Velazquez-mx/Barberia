import type { ClientPayload, ClientRecord } from '../types/clientType';
import { mockCreateClient, mockDeleteClient, mockListClients, mockUpdateClient } from '../mocks/adminMock';

/*
 * Servicio de clientes.
 * Hoy responde con datos mock. Para integrar con el backend solo cambia el cuerpo de estas funciones
 * (usando apiClient y el token); los contenedores no se tocan:
 *
 *   getClients    -> GET    /clients      (pendiente en el backend)
 *   createClient  -> POST   /clients      (pendiente; el registro actual exige contraseña, fecha de nacimiento y género)
 *   updateClient  -> PUT    /users        (existe: nombre, correo, teléfono)
 *   deleteClient  -> DELETE /users/:id    (existe; para clientes es borrado físico)
 */

export const getClients = async (_token: string): Promise<ClientRecord[]> => mockListClients();

export const createClient = async (payload: ClientPayload, _token: string): Promise<ClientRecord> =>
    mockCreateClient(payload);

export const updateClient = async (id: string, payload: ClientPayload, _token: string): Promise<ClientRecord> =>
    mockUpdateClient(id, payload);

export const deleteClient = async (id: string, _token: string): Promise<void> => mockDeleteClient(id);
