import { canUpdateUser, canUpdateManagerTitle, canUpdateBarberProfile } from '../src/services/userPermissions.js';
import type { UserRole } from '../src/types/entities/user.interface.js';

const A = 'a0000000-0000-0000-0000-000000000001';
const B = 'b0000000-0000-0000-0000-000000000002';

describe('canUpdateUser', () => {
    test('client puede actualizarse a sí mismo', () => {
        expect(canUpdateUser({ id: A, role: 'client' }, { id: A, role: 'client' })).toBe(true);
    });

    test('client no puede actualizar a otro client', () => {
        expect(canUpdateUser({ id: A, role: 'client' }, { id: B, role: 'client' })).toBe(false);
    });

    const otherRoles: UserRole[] = ['barber', 'manager', 'receptionist'];
    test.each(otherRoles)('client no puede actualizar a un %s', (role) => {
        expect(canUpdateUser({ id: A, role: 'client' }, { id: B, role })).toBe(false);
    });

    test('barber nunca puede actualizar a nadie, ni a sí mismo', () => {
        expect(canUpdateUser({ id: A, role: 'barber' }, { id: A, role: 'barber' })).toBe(false);
        expect(canUpdateUser({ id: A, role: 'barber' }, { id: B, role: 'client' })).toBe(false);
    });

    test('receptionist puede actualizar a un client', () => {
        expect(canUpdateUser({ id: A, role: 'receptionist' }, { id: B, role: 'client' })).toBe(true);
    });

    test('receptionist no puede actualizarse a sí mismo', () => {
        expect(canUpdateUser({ id: A, role: 'receptionist' }, { id: A, role: 'receptionist' })).toBe(false);
    });

    const nonClientRoles: UserRole[] = ['barber', 'manager', 'receptionist'];
    test.each(nonClientRoles)('receptionist no puede actualizar a un %s que no sea client', (role) => {
        expect(canUpdateUser({ id: A, role: 'receptionist' }, { id: B, role })).toBe(false);
    });

    test('manager puede actualizar a un client, barber o receptionist', () => {
        expect(canUpdateUser({ id: A, role: 'manager' }, { id: B, role: 'client' })).toBe(true);
        expect(canUpdateUser({ id: A, role: 'manager' }, { id: B, role: 'barber' })).toBe(true);
        expect(canUpdateUser({ id: A, role: 'manager' }, { id: B, role: 'receptionist' })).toBe(true);
    });

    test('manager puede actualizarse a sí mismo', () => {
        expect(canUpdateUser({ id: A, role: 'manager' }, { id: A, role: 'manager' })).toBe(true);
    });

    test('manager no puede actualizar a otro manager', () => {
        expect(canUpdateUser({ id: A, role: 'manager' }, { id: B, role: 'manager' })).toBe(false);
    });
});

describe('canUpdateManagerTitle', () => {
    test('manager puede actualizar su propio título', () => {
        expect(canUpdateManagerTitle({ id: A, role: 'manager' }, A)).toBe(true);
    });

    test('manager no puede actualizar el título de otro manager', () => {
        expect(canUpdateManagerTitle({ id: A, role: 'manager' }, B)).toBe(false);
    });

    const nonManagerRoles: UserRole[] = ['client', 'barber', 'receptionist'];
    test.each(nonManagerRoles)('%s no puede actualizar ningún título de manager', (role) => {
        expect(canUpdateManagerTitle({ id: A, role }, A)).toBe(false);
        expect(canUpdateManagerTitle({ id: A, role }, B)).toBe(false);
    });
});

describe('canUpdateBarberProfile', () => {
    test('manager puede actualizar el perfil de un barbero', () => {
        expect(canUpdateBarberProfile({ id: A, role: 'manager' })).toBe(true);
    });

    const nonManagerRoles: UserRole[] = ['client', 'barber', 'receptionist'];
    test.each(nonManagerRoles)('%s no puede actualizar el perfil de un barbero', (role) => {
        expect(canUpdateBarberProfile({ id: A, role })).toBe(false);
    });
});
