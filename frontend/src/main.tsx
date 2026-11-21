import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import router from './router.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { initBusinessTimezone } from './services/timezoneService.ts';

await initBusinessTimezone();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* AuthProvider siempre envuleve toda la aplicación*/}
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
