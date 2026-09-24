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
