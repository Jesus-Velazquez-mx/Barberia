import type { ReactNode } from 'react';

interface ManagerPageHeaderProps {
  title: string;
  subtitle: string;
  /* Botones de acción (Filtros, Nuevo...) alineados a la derecha. */
  children?: ReactNode;
}

export function ManagerPageHeader({ title, subtitle, children }: ManagerPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="m-0 font-sans text-2xl font-bold tracking-normal text-[var(--text-h)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--text)]">{subtitle}</p>
      </div>

      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
}
