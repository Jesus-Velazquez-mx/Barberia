import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import { getHomeRouteByRole } from '../utils/roleRedirect';

interface RoleProtectedRouteProps {
    allowedRole: UserRole;
}

export function RoleProtectedRoute({ allowedRole }: RoleProtectedRouteProps) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== allowedRole) {
        return <Navigate to={getHomeRouteByRole(user?.role as UserRole)} replace />;
    }

    /* Que pueda acceder a la ruta protegida */
    return <Outlet />;
}