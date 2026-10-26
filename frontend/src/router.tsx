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
import StaffAppointmentsPage from './pages/staff/StaffAppointmentsPage';
import ManagerSectionPlaceholderPage from './pages/staff/ManagerSectionPlaceholderPage';
import ManagerManagementPage from './pages/staff/ManagerManagementPage';
import StaffInventoryPage from './pages/staff/StaffInventoryPage';
import DashboardLayout from './pages/DashboardLayout';
import RecommendationPage from './pages/client/RecommendationPage';
import ClientAppointmentsPage from './pages/client/ClientAppointmentPage';
import ClientAppointmentDetailPage from './pages/client/ClientAppointmentDetailPage';

/* Enlace "Volver" de los CRUD de Gestión que aún son placeholders. */
const MANAGEMENT_BACK_LINK = { to: '/manager/management', label: 'Volver a Gestión' };

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
            // Temporal: se reemplaza por la vista real de citas agendadas
            path: '/client/appointments',
            element: <ClientAppointmentsPage />
          },
          {
            path: '/client/appointments/:appointmentId',
            element: <ClientAppointmentDetailPage />
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
            path: '/manager/appointments',
            element: <StaffAppointmentsPage />
          },
          {
            path: '/manager/booking',
            element: <BookAppointmentPage />
          },
          {
            path: '/manager/inventory',
            element: <StaffInventoryPage role="manager" />
          },
          {
            // Temporal: se reemplaza por el CRUD de suministros
            path: '/manager/inventory/supplies',
            element: (
              <ManagerSectionPlaceholderPage
                title="Suministros"
                subtitle="Administración de los insumos y sus existencias."
                backTo={{ to: '/manager/inventory', label: 'Volver a Inventario' }}
              />
            )
          },
          {
            // Temporal: se reemplaza por el CRUD de categorías de suministros
            path: '/manager/inventory/supply-categories',
            element: (
              <ManagerSectionPlaceholderPage
                title="Categorías de suministros"
                subtitle="Organización de los insumos por categoría."
                backTo={{ to: '/manager/inventory', label: 'Volver a Inventario' }}
              />
            )
          },
          {
            path: '/manager/management',
            element: <ManagerManagementPage />
          },
          {
            // Temporal: se reemplaza por el CRUD de sucursales
            path: '/manager/management/shops',
            element: (
              <ManagerSectionPlaceholderPage
                title="Sucursales"
                subtitle="Administración de las sucursales de la barbería."
                backTo={MANAGEMENT_BACK_LINK}
              />
            )
          },
          {
            // Temporal: se reemplaza por el CRUD de turnos
            path: '/manager/management/shifts',
            element: (
              <ManagerSectionPlaceholderPage
                title="Turnos"
                subtitle="Horarios de los turnos de trabajo."
                backTo={MANAGEMENT_BACK_LINK}
              />
            )
          },
          {
            // Temporal: se reemplaza por el CRUD de servicios ofrecidos
            path: '/manager/management/services',
            element: (
              <ManagerSectionPlaceholderPage
                title="Servicios ofrecidos"
                subtitle="Administración de los servicios, su duración y su precio."
                backTo={MANAGEMENT_BACK_LINK}
              />
            )
          },
          {
            // Temporal: se reemplaza por el CRUD de categorías de servicios
            path: '/manager/management/service-categories',
            element: (
              <ManagerSectionPlaceholderPage
                title="Categorías de servicios"
                subtitle="Organización de los servicios por categoría."
                backTo={MANAGEMENT_BACK_LINK}
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
            element: <StaffAppointmentsPage />
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
            path: '/receptionist/inventory',
            element: <StaffInventoryPage role="receptionist" />
          },
          {
            // Temporal: se reemplaza por el CRUD de suministros
            path: '/receptionist/inventory/supplies',
            element: (
              <ManagerSectionPlaceholderPage
                title="Suministros"
                subtitle="Administración de los insumos y sus existencias."
                backTo={{ to: '/receptionist/inventory', label: 'Volver a Inventario' }}
              />
            )
          },
          {
            // Temporal: se reemplaza por el CRUD de categorías de suministros
            path: '/receptionist/inventory/supply-categories',
            element: (
              <ManagerSectionPlaceholderPage
                title="Categorías de suministros"
                subtitle="Organización de los insumos por categoría."
                backTo={{ to: '/receptionist/inventory', label: 'Volver a Inventario' }}
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
