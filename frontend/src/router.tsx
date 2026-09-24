import { createBrowserRouter } from 'react-router-dom';
import ExamplePage from './pages/ExamplePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlaceholderPage from './pages/PlaceholderPage';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

const router = createBrowserRouter([
  /* Client */
  {
    element: <RoleProtectedRoute allowedRole="client" />,
    children: [
      {
        path: '/client/home',
        element: <PlaceholderPage title="client" />,
      },
    ]
  },
  {
    /* Barber */
    element: <RoleProtectedRoute allowedRole="barber" />,
    children: [
      {
        path: '/barber/home',
        element: <PlaceholderPage title="barber" />,
      },
    ]
  },
  {
    /* Manager */
    element: <RoleProtectedRoute allowedRole="manager" />,
    children: [
      {
        path: '/manager/home',
        element: <PlaceholderPage title="manager" />,
      },
    ]
  },
  {
    /* Receptionist */
    element: <RoleProtectedRoute allowedRole="receptionist" />,
    children: [
      {
        path: '/receptionist/home',
        element: <PlaceholderPage title="receptionist" />,
      },
    ]
  },
  {
    /* Public */
    element: <PublicRoute />,
    children: [
      {
        path: '/',
        element: <ExamplePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      }
    ]
  }
]);

export default router;