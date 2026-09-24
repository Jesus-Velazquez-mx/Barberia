import { createBrowserRouter } from 'react-router-dom';
import ExamplePage from './pages/ExamplePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Add new routes here as pages are added to src/pages/.
const router = createBrowserRouter([
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
]);


export default router;
