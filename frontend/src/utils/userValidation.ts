import type { User } from "../types/auth";

// Valida si el objeto user presente en localStorage es un objeto
// de tipo User
export function isStoredUserValid(value: unknown): value is User {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const user = value as Record<string, unknown>;
    const hasRequiredStringFields = [
        'id',
        'email',
        'firstName',
        'lastName',
        'birthDate',
        'gender',
        'createdAt',
        'updatedAt'
    ].every((field) => typeof user[field] === 'string');

    if (!hasRequiredStringFields || (typeof user.phone !== 'string' && user.phone !== null)) {
        return false;
    }

    if (!['client', 'barber', 'manager', 'receptionist'].includes(user.role as string)) {
        return false;
    }

    if (typeof user.profile !== 'object' || user.profile === null) {
        return false;
    }

    const profile = user.profile as Record<string, unknown>;
    switch (user.role) {
        case 'client':
            return (
                (profile.facialStructureType === null ||
                    ['oval', 'triangle', 'heart', 'round', 'diamond', 'square', 'rectangle'].includes(
                        profile.facialStructureType as string
                    )) &&
                typeof profile.completedServicesCount === 'number'
            );
        case 'barber':
            return (
                typeof profile.shopId === 'string' &&
                typeof profile.shiftId === 'string' &&
                (typeof profile.bio === 'string' || profile.bio === null) &&
                typeof profile.isAcceptingBookings === 'boolean'
            );
        case 'manager':
            return typeof profile.title === 'string' || profile.title === null;
        case 'receptionist':
            return typeof profile.shopId === 'string' && typeof profile.shiftId === 'string';
    }

    return false;
}
