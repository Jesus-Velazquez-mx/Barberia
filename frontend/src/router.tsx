import { createBrowserRouter } from 'react-router-dom';
import ExamplePage from './pages/ExamplePage';

// Add new routes here as pages are added to src/pages/.
const router = createBrowserRouter([
  {
    path: '/',
    element: <ExamplePage />,
  },
]);

export default router;
