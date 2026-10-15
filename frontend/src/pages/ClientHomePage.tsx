import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { CalendarPlus, UserRound } from 'lucide-react';
import { DashboardSidebar, type SidebarItem } from '../components/DashboardSidebarComponent';
import { LogoutConfirmModal } from '../components/LogoutConfirmModalComponent';
import { useAuth } from '../context/AuthContext';

const MANAGER_NAV_ITEMS: SidebarItem[] = [
  { to: '/client/booking', label: 'Agendar Cita', icon: <CalendarPlus size={20} aria-hidden="true" /> },
  { to: '/client/profile', label: 'Mi Perfil', icon: <UserRound size={20} aria-hidden="true" /> },
];

/* Layout compartido por todas las secciones del dashboard del manager: sidebar + contenido de la ruta. */
function ClientHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (!user) return null;

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        firstName={user.firstName}
        items={MANAGER_NAV_ITEMS}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      <main className="min-w-0 flex-1 px-4 pb-10 pt-20 sm:px-12 lg:py-10">
        <Outlet />
      </main>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}

export default ClientHomePage;
