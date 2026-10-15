import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ClientHomePage from './pages/ClientHomePage';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import EditUserPage from './pages/EditUserPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import ManagerLayoutPage from './pages/ManagerLayoutPage';
import ManagerStaffPage from './pages/ManagerStaffPage';
import ManagerClientsPage from './pages/ManagerClientsPage';
import ManagerSectionPlaceholderPage from './pages/ManagerSectionPlaceholderPage';

const router = createBrowserRouter([
  /* Client */
  {
    element: <RoleProtectedRoute allowedRole="client" />,
    children: [
      {
        // Destino del login para el cliente: abre la primera sección del dashboard
        path: '/client/home',
        element: <Navigate to="/client/booking" replace />
      },
      {
        // Layout compartido (sidebar + contenido) de las secciones del cliente
        element: <ClientHomePage />,
        children: [
          {
            path: '/client/booking',
            element: <BookAppointmentPage />
          },
          {
            path: '/client/profile',
            element: <EditUserPage />
          }
        ]
      }
    ]
  },
  {
    /* Manager */
    element: <RoleProtectedRoute allowedRole="manager" />,
    children: [
      {
        // Destino del login para el manager: abre la primera sección del dashboard
        path: '/manager/home',
        element: <Navigate to="/manager/staff" replace />
      },
      {
        // Layout compartido (sidebar + contenido) de las secciones del dashboard
        element: <ManagerLayoutPage />,
        children: [
          {
            path: '/manager/staff',
            element: <ManagerStaffPage />
          },
          {
            path: '/manager/clients',
            element: <ManagerClientsPage />
          },
          {
            // Temporal: se reemplaza por la vista real de insumos
            path: '/manager/inventory',
            element: (
              <ManagerSectionPlaceholderPage
                title="Inventario"
                subtitle="Control de insumos y existencias."
                plannedItems={['insumos', 'categorías', 'existencias', 'movimientos de entrada y salida']}
              />
            )
          },
          {
            // Temporal: se reemplaza por la vista real de gestión
            path: '/manager/management',
            element: (
              <ManagerSectionPlaceholderPage
                title="Gestión"
                subtitle="Configuración general del negocio."
                plannedItems={['sucursales', 'servicios ofrecidos', 'horarios de atención']}
              />
            )
          }
        ]
      }
    ]
  },
  {
    /* Receptionist */
    element: <RoleProtectedRoute allowedRole="receptionist" />,
    children: [
      {
        path: '/receptionist/home',
        element: <PlaceholderPage title="receptionist" />
      }
    ]
  },
  {
    /* Public */
    element: <PublicRoute />,
    children: [
      {
        path: '/',
        element: <LandingPage />
      },
      {
        path: '/login',
        element: <LoginPage />
      },
      {
        path: '/register',
        element: <RegisterPage />
      }
    ]
  }
]);

export default router;
