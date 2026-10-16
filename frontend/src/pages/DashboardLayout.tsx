import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '../components/DashboardSidebarComponent';
import { LogoutConfirmModal } from '../components/LogoutConfirmModalComponent';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import { Users, UserRound, Package, Settings, CalendarPlus } from 'lucide-react';

const NAV_ITEMS = {
  manager: [
    { to: '/manager/staff', label: 'Personal', icon: <Users size={20} aria-hidden="true" /> },
    { to: '/manager/clients', label: 'Clientes', icon: <UserRound size={20} aria-hidden="true" /> },
    { to: '/manager/inventory', label: 'Inventario', icon: <Package size={20} aria-hidden="true" /> },
    { to: '/manager/management', label: 'Gestión', icon: <Settings size={20} aria-hidden="true" /> }
  ],
  client: [
    { to: '/client/booking', label: 'Agendar Cita', icon: <CalendarPlus size={20} aria-hidden="true" /> },
    { to: '/client/profile', label: 'Mi Perfil', icon: <UserRound size={20} aria-hidden="true" /> }
  ],
  receptionist: [
    { to: '/receptionist/booking', label: 'Agendar Cita', icon: <CalendarPlus size={20} aria-hidden="true" /> },
    { to: '/receptionist/clients', label: 'Clientes', icon: <UserRound size={20} aria-hidden="true" /> },
    { to: '/receptionist/inventory', label: 'Inventario', icon: <Package size={20} aria-hidden="true" /> },
  ]
};

interface DashboardLayoutProps {
  role: UserRole;
}

/* Layout compartido por todas las secciones del dashboard del manager: sidebar + contenido de la ruta. */
export default function DashboardLayout({ role }: DashboardLayoutProps) {
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
        items={NAV_ITEMS[role as keyof typeof NAV_ITEMS] ?? NAV_ITEMS.client}
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
