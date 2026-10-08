import type { UserRole } from '../types/entities/user.interface.js';

export interface UserIdentity {
    id: string;
    role: UserRole;
}

/**
 * Authorization matrix for PUT /user (shared-data update):
 * - client: only themselves.
 * - receptionist: clients only, never themselves or other staff.
 * - manager: anyone except another manager; a manager may only update themselves.
 *
 * Barbers are never a UserIdentity here: they have no user account and never
 * authenticate, so they can't be a performer or a target of this endpoint.
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
 * PUT /manager: a manager may only update their own title.
 */
export const canUpdateManagerTitle = (performer: UserIdentity, targetId: string): boolean =>
    performer.role === 'manager' && performer.id === targetId;

/**
 * PUT /barber: only managers may update a barber's profile (bio/is_accepting_bookings).
 * Barbers have no user account and can never be the performer, so no target check is needed.
 */
export const canUpdateBarberProfile = (performer: UserIdentity): boolean => performer.role === 'manager';

/**
 * DELETE /barbers/:id: only managers may soft-delete a barber. Same rule as
 * canUpdateBarberProfile, kept as its own named permission for clarity.
 */
export const canDeleteBarber = (performer: UserIdentity): boolean => performer.role === 'manager';
