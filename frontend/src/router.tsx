import { createBrowserRouter } from 'react-router-dom';
import ExamplePage from './pages/ExamplePage';
import LoginPage from './pages/LoginPage';

// Add new routes here as pages are added to src/pages/.
const router = createBrowserRouter([
  {
    path: '/',
    element: <ExamplePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  }
]);


export default router;
