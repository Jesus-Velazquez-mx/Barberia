import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface ManagementMenuItem {
  /* Ruta del CRUD al que lleva el botón. */
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
}

interface ManagementMenuProps {
  items: ManagementMenuItem[];
  /* Nombre accesible de la navegación (cambia según la sección que lo use). */
  ariaLabel?: string;
}

/* Botones de acceso a los CRUD de una sección (Gestión, Inventario). */
export function ManagementMenu({ items, ariaLabel = 'Secciones de gestión' }: ManagementMenuProps) {
  return (
    <nav aria-label={ariaLabel} className="mt-6 grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#1A1A1A] p-5 transition-colors hover:border-[var(--accent)]/60 hover:bg-white/5 focus-visible:border-[var(--accent)]/60 focus-visible:outline-none"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
            {item.icon}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-sans text-base font-bold tracking-normal text-[var(--text-h)]">
              {item.title}
            </span>
            <span className="mt-1 block text-sm text-[var(--text)]">{item.description}</span>
          </span>

          <ChevronRight
            size={20}
            aria-hidden="true"
            className="shrink-0 text-[var(--text)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]"
          />
        </Link>
      ))}
    </nav>
  );
}
