import type { UserRole } from '../types/entities/user.interface.js';

export interface UserIdentity {
    id: string;
    role: UserRole;
}

/**
 * Matriz de autorización para PUT /user (actualización de datos compartidos):
 * - client: solo a sí mismos.
 * - receptionist: únicamente a clientes, nunca a sí mismos ni a otro personal.
 * - manager: a cualquiera excepto a otro gerente; un gerente solo puede actualizarse a sí mismo.
 *
 * Los barberos nunca son UserIdentity aquí: no tienen cuenta de usuario y nunca
 * se autentican, por lo que no pueden ser actores ni objetivos de este endpoint.
 */
export const canUpdateUser = (performer: UserIdentity, target: UserIdentity): boolean => {
    switch (performer.role) {
        case 'client':
            return performer.id === target.id;
        case 'receptionist':
            return target.role === 'client';
        case 'manager':
            return target.role === 'manager' ? performer.id === target.id : true;
    }
};

/**
 * PUT /manager: un gerente solo puede actualizar su propio título.
 */
export const canUpdateManagerTitle = (performer: UserIdentity, targetId: string): boolean =>
    performer.role === 'manager' && performer.id === targetId;

/**
 * PUT /barber: solo los gerentes pueden actualizar el perfil de un barbero (biografía/estado de reservas).
 * Los barberos no tienen cuenta de usuario y nunca pueden ser quienes ejecutan la acción, por lo que no se requiere validación de objetivo.
 */
export const canUpdateBarberProfile = (performer: UserIdentity): boolean => performer.role === 'manager';

/**
 * DELETE /barbers/:id: solo los gerentes pueden realizar un borrado lógico de un barbero. Misma regla que
 * canUpdateBarberProfile, se mantiene como su propia función de permiso nombrada por claridad.
 */
export const canDeleteBarber = (performer: UserIdentity): boolean => performer.role === 'manager';

/**
 * /shops: Solo los usuarios con el rol 'manager' pueden registrar, editar o eliminar sucursales.
 */
export const canManageShops = (performer: UserIdentity): boolean => performer.role === 'manager';
