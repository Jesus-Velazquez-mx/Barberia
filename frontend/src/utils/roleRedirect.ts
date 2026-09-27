import type { UserRole } from '../types/auth';

/* Rutas por de inicio por rol */
/* Record es un diccionario. Solo acepta las claves definidas en UserRole en string*/
const ROLE_HOME_ROUTES: Record<UserRole, string> = {
    client: '/client/home',
    barber: '/barber/home',
    manager: '/manager/home',
    receptionist: '/receptionist/home',
};

export function getHomeRouteByRole(role: UserRole): string {
    return ROLE_HOME_ROUTES[role] ?? '/';
}