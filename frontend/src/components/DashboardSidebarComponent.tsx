import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import mrBarberLogo from '../assets/logos/MrBarberLogo.webp';
import userIcon from '../assets/icons/user-icon.svg';

export interface SidebarItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface DashboardSidebarProps {
  firstName: string;
  /* Secciones de navegación del rol. Si no se pasan, se muestra la navegación del cliente. */
  items?: SidebarItem[];
  /* Si se pasa, se muestra el botón "Cerrar sesión" al pie del menú. */
  onLogout?: () => void;
}

/* Secciones del dashboard aún sin definir */
const PENDING_ITEMS = ['Pendiente', 'Pendiente', 'Pendiente', 'Pendiente'];

const NAV_LINK_CLASSES = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 transition-colors ${isActive ? 'bg-[var(--accent)]/60' : 'hover:bg-white/5'}`;

export function DashboardSidebar({ firstName, items, onLogout }: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante: solo en mobile/tablet, abre y cierra el panel. */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#1A1A1A] text-white shadow-[var(--shadow)] transition-colors hover:border-[var(--accent)]/60 lg:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Fondo oscuro detrás del panel cuando está abierto (solo mobile/tablet). */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsOpen(false)}
          role="presentation"
        />
      )}

      {/* En mobile/tablet: panel fijo que entra/sale con un slide (fuera del flujo,
          no empuja el contenido). En desktop (lg:): vuelve a ser un sidebar normal,
          estático, siempre visible, parte del layout en flex. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[230px] shrink-0 flex-col border-r border-white/10 bg-[#1A1A1A] transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col items-center gap-5 border-b border-white/10 px-4 py-8">
          <img src={mrBarberLogo} alt="Mr. Barber" className="h-24 w-24" />
          <p className="text-center text-base text-[var(--text-h)]">Bienvenido, {firstName}</p>
        </div>

        <nav className="flex flex-col gap-3 py-9 text-sm font-semibold text-[var(--text-h)]">
          {items ? (
            items.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setIsOpen(false)} className={NAV_LINK_CLASSES}>
                {item.icon}
                {item.label}
              </NavLink>
            ))
          ) : (
            <>
              <NavLink to="/profile" onClick={() => setIsOpen(false)} className={NAV_LINK_CLASSES}>
                <img src={userIcon} alt="" className="h-5 w-5" />
                Perfil de usuario
              </NavLink>

              {PENDING_ITEMS.map((label, index) => (
                <span key={index} className="px-4 py-3">
                  {label}
                </span>
              ))}
            </>
          )}
        </nav>

        {onLogout && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="mt-auto flex cursor-pointer items-center gap-3 border-t border-white/10 px-4 py-4 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-white/5 hover:text-[var(--text-h)]"
          >
            <LogOut size={20} aria-hidden="true" />
            Cerrar sesión
          </button>
        )}
      </aside>
    </>
  );
}
