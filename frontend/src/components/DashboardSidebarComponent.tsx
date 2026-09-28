import { NavLink } from 'react-router-dom';
import mrBarberLogo from '../assets/logos/MrBarberLogo.webp';
import userIcon from '../assets/icons/user-icon.svg';

interface DashboardSidebarProps {
  firstName: string;
}

/* Secciones del dashboard aún sin definir */
const PENDING_ITEMS = ['Pendiente', 'Pendiente', 'Pendiente', 'Pendiente'];

export function DashboardSidebar({ firstName }: DashboardSidebarProps) {
  return (
    <aside className="flex w-[230px] shrink-0 flex-col border-r border-white/10 bg-[#1A1A1A]">
      <div className="flex flex-col items-center gap-5 border-b border-white/10 px-4 py-8">
        <img src={mrBarberLogo} alt="Mr. Barber" className="h-24 w-24" />
        <p className="text-center text-base text-[var(--text-h)]">Bienvenido, {firstName}</p>
      </div>

      <nav className="flex flex-col gap-3 py-9 text-sm font-semibold text-[var(--text-h)]">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 transition-colors ${
              isActive ? 'bg-[var(--accent)]/60' : 'hover:bg-white/5'
            }`
          }
        >
          <img src={userIcon} alt="" className="h-5 w-5" />
          Perfil de usuario
        </NavLink>

        {PENDING_ITEMS.map((label, index) => (
          <span key={index} className="px-4 py-3">
            {label}
          </span>
        ))}
      </nav>
    </aside>
  );
}
