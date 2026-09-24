import type { UserRole } from '../types/entities/user.interface.js';

export interface UserIdentity {
    id: string;
    role: UserRole;
}

/**
 * Authorization matrix for PUT /user (shared-data update):
 * - client: only themselves.
 * - barber: never allowed, not even themselves.
 * - receptionist: clients only, never themselves or other staff.
 * - manager: anyone except another manager; a manager may only update themselves.
 */
export const canUpdateUser = (performer: UserIdentity, target: UserIdentity): boolean => {
    switch (performer.role) {
        case 'barber':
            return false;
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
 * PUT /barber: only managers may update a barber's profile (bio/is_accepting_bookings),
 * never barbers themselves. The barbers table is role-exclusive, so no target check is needed.
 */
export const canUpdateBarberProfile = (performer: UserIdentity): boolean =>
    performer.role === 'manager';
