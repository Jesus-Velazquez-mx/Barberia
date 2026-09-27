import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteByRole } from '../utils/roleRedirect';
import type { UserRole } from '../types/auth';

export function PublicRoute() {
    const { user, isAuthenticated } = useAuth();

    if (isAuthenticated && user?.role) {
        return <Navigate to={getHomeRouteByRole(user.role as UserRole)} replace />;
    }

    /* Que pueda acceder a la ruta pública */
    return <Outlet />;
}