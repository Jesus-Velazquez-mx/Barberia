import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import EditUserPage from './pages/client/EditUserPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import ManagerStaffPage from './pages/staff/ManagerStaffPage';
import ManagerClientsPage from './pages/staff/StaffClientsPage';
import ManagerSectionPlaceholderPage from './pages/staff/ManagerSectionPlaceholderPage';
import DashboardLayout from './pages/DashboardLayout';
import RecommendationPage from './pages/client/RecommendationPage';

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
        element: <DashboardLayout role="client" />,
        children: [
          {
            path: '/client/booking',
            element: <BookAppointmentPage />
          },
          {
            path: '/client/recommend-haircut',
            element: <RecommendationPage />
          },
          {
            path: '/client/profile',
            element: <EditUserPage />
          }
        ]
      }
    ]
  },
  /* Manager */
  {
    element: <RoleProtectedRoute allowedRole="manager" />,
    children: [
      {
        // Destino del login para el manager: abre la primera sección del dashboard
        path: '/manager/home',
        element: <Navigate to="/manager/staff" replace />
      },
      {
        // Layout compartido (sidebar + contenido) de las secciones del dashboard
        element: <DashboardLayout role="manager" />,
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
  /* Receptionist */
  {
    element: <RoleProtectedRoute allowedRole="receptionist" />,
    children: [
      {
        // Destino del login para el recepcionista: abre la primera sección del dashboard
        path: '/receptionist/home',
        element: <Navigate to="/receptionist/booking" replace />
      },
      {
        // Layout compartido (sidebar + contenido) de las secciones del recepcionista
        element: <DashboardLayout role="receptionist" />,
        children: [
          {
            path: '/receptionist/appointments',
            element: (
              <ManagerSectionPlaceholderPage
                title="Calendario"
                subtitle="Citas agendadas"
              />
            )
          },
          {
            path: '/receptionist/booking',
            element: <BookAppointmentPage />
          },
          {
            path: '/receptionist/clients',
            element: <ManagerClientsPage />
          },
          {
            // Temporal: se reemplaza por la vista real de insumos
            path: '/receptionist/inventory',
            element: (
              <ManagerSectionPlaceholderPage
                title="Inventario"
                subtitle="Control de insumos y existencias."
                plannedItems={['insumos', 'categorías', 'existencias', 'movimientos de entrada y salida']}
              />
            )
          }
        ]
      }
    ]
  },
  /* Public */
  {
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
