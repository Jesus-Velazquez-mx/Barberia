import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomeRouteByRole } from '../../utils/roleRedirect';
import type { UserRole } from '../../types/auth';

/* Ruta comodín: cualquier URL inexistente lleva al dashboard del rol (o al login si no hay sesión) */
export function NotFoundRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  const homeRoute = getHomeRouteByRole(user.role as UserRole);

  /* Evita un bucle infinito si la ruta de inicio del rol tampoco existe (p. ej. barber) */
  if (homeRoute === pathname) {
    return null;
  }

  return <Navigate to={homeRoute} replace />;
}
