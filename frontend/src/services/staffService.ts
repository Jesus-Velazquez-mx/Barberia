import type { StaffMember, StaffPayload } from '../types/staffType';
import { mockCreateStaff, mockDeleteStaff, mockListStaff, mockUpdateStaff } from '../mocks/adminMock';

/*
 * Servicio de personal (barberos y recepcionistas).
 * Hoy responde con datos mock. Para integrar con el backend solo cambia el cuerpo de estas funciones
 * (usando apiClient y el token); los contenedores no se tocan:
 *
 *   getStaff     -> GET    /staff               (pendiente en el backend)
 *   createStaff  -> POST   /barbers             (pendiente) si role = barber
 *                   POST   /users               (pendiente) si role = receptionist
 *   updateStaff  -> PUT    /users               (existe: nombre, correo, teléfono) si role = receptionist
 *                   PUT    /barbers             (existe, pero solo acepta bio e isAcceptingBookings) si role = barber
 *   deleteStaff  -> DELETE /barbers/:id         (existe, baja lógica) si role = barber
 *                   DELETE /users/:id           (existe, baja lógica para staff) si role = receptionist
 */

export const getStaff = async (_token: string): Promise<StaffMember[]> => mockListStaff();

export const createStaff = async (payload: StaffPayload, _token: string): Promise<StaffMember> =>
    mockCreateStaff(payload);

export const updateStaff = async (id: string, payload: StaffPayload, _token: string): Promise<StaffMember> =>
    mockUpdateStaff(id, payload);

/* Recibe el miembro completo porque el endpoint depende de su rol. */
export const deleteStaff = async (member: StaffMember, _token: string): Promise<void> => mockDeleteStaff(member.id);
