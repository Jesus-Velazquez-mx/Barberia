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

export const canCreateClient = (performer: UserIdentity): boolean => {
    return performer.role === 'manager' || performer.role === 'receptionist';
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
 * GET /shops/:id/barbers y GET /barbers/:id: el personal (recepcionistas y gerentes) ve el perfil completo del
 * barbero, incluidos los dados de baja; los clientes solo ven la vista pública de barberos activos.
 */
export const canViewFullBarberData = (performer: UserIdentity): boolean =>
    performer.role === 'manager' || performer.role === 'receptionist';

/**
 * /receptionists y GET /shops/:id/receptionists: solo los gerentes pueden gestionar recepcionistas (y únicamente
 * los de las sucursales que administran; esa restricción por sucursal la aplica el servicio).
 */
export const canManageReceptionists = (performer: UserIdentity): boolean => performer.role === 'manager';

/**
 * Un gerente solo gestiona a los recepcionistas de las sucursales que administra.
 */
export const canManageShopReceptionists = (shopId: string, managedShopIds: string[]): boolean =>
    managedShopIds.includes(shopId);

/**
 * /shops: Solo los usuarios con el rol 'manager' pueden registrar, editar o eliminar sucursales.
 */
export const canManageShops = (performer: UserIdentity): boolean => performer.role === 'manager';

/**
 * GET /recommendations: un cliente solo puede consultar su propio historial de recomendaciones; la recepción y los
 * gerentes pueden consultar el de cualquier cliente.
 */
export const canViewRecommendationHistory = (performer: UserIdentity, targetClientId: string): boolean =>
    performer.role === 'client' ? performer.id === targetClientId : true;

/**
 * /supplies-categories: Solo los usuarios con rol 'manager' pueden crear, editar o eliminar categorías de insumos.
 */
export const canManageSuppliesCategories = (performer: UserIdentity): boolean => performer.role === 'manager';

/**
 * /supplies: Los usuarios con rol 'manager' puede registrar, editar o eliminar insumos.
 */
export const canManageSupplies = (performer: UserIdentity): boolean => performer.role === 'manager';

/**
 * GET /shifts: el personal (recepcionistas y gerentes) puede consultar los turnos; los clientes no.
 */
export const canViewShifts = (performer: UserIdentity): boolean =>
    performer.role === 'manager' || performer.role === 'receptionist';

/**
 * POST/PUT/DELETE /shifts: solo los gerentes pueden crear, editar o eliminar turnos.
 */
export const canManageShifts = (performer: UserIdentity): boolean => performer.role === 'manager';

/**
 * POST /appointments:
 * - client: solo puede agendar para sí mismo (nunca para otro cliente ni para un invitado), en cualquier sucursal.
 * - receptionist: para cualquier cliente o invitado, únicamente en la sucursal donde trabaja.
 * - manager: para cualquier cliente o invitado, únicamente en las sucursales que administra.
 */
export const canCreateAppointment = (
    performer: UserIdentity,
    booking: { clientId: string | null; shopId: string; shopManagerId: string },
    receptionistShopId: string | null = null
): boolean => {
    switch (performer.role) {
        case 'client':
            return booking.clientId === performer.id;
        case 'receptionist':
            return receptionistShopId === booking.shopId;
        case 'manager':
            return booking.shopManagerId === performer.id;
    }
};

/**
 * PUT /appointments/:id: mismo alcance que canCreateAppointment, pero sobre la cita existente:
 * - client: solo sus propias citas (las de invitados tienen clientId null, así que nunca coinciden).
 * - receptionist: citas de la sucursal donde trabaja.
 * - manager: citas de las sucursales que administra.
 */
export const canEditAppointment = (
    performer: UserIdentity,
    appointment: { clientId: string | null; shopId: string; shopManagerId: string },
    receptionistShopId: string | null = null
): boolean => {
    switch (performer.role) {
        case 'client':
            return appointment.clientId !== null && appointment.clientId === performer.id;
        case 'receptionist':
            return receptionistShopId === appointment.shopId;
        case 'manager':
            return appointment.shopManagerId === performer.id;
    }
};

/** Horas mínimas de anticipación con las que un cliente puede editar o cancelar su cita. */
export const CLIENT_EDIT_CUTOFF_HOURS = 8;

/**
 * Solo los clientes están sujetos al límite de 8 horas; recepción y gerentes pueden editar hasta que la
 * cita pase a checked_in. Es una comparación entre instantes absolutos (sin zona horaria del negocio).
 */
export const isWithinClientEditCutoff = (
    performer: UserIdentity,
    scheduledStart: Date,
    now: Date = new Date()
): boolean =>
    performer.role !== 'client' ||
    scheduledStart.getTime() - now.getTime() >= CLIENT_EDIT_CUTOFF_HOURS * 60 * 60 * 1000;

/**
 * GET /appointments: la recepción y los gerentes solo pueden consultar las citas de las sucursales a las que
 * pertenecen (la sucursal donde trabaja la recepción; las que administra el gerente).
 */
export const canViewShopAppointments = (shopId: string, accessibleShopIds: string[]): boolean =>
    accessibleShopIds.includes(shopId);

/**
 * /servicesCategories: Solo los usuarios con rol 'manager' pueden crear, editar o eliminar categorías de servicios.
 */
export const canManageServiceCategories = (performer: UserIdentity): boolean => performer.role === 'manager';

/**
 * /services: Solo los usuarios con rol 'manager' pueden registrar, editar o eliminar servicios del catálogo.
 */
export const canManageServices = (performer: UserIdentity): boolean => performer.role === 'manager';
