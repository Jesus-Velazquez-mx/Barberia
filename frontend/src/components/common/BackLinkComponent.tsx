import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackLinkProps {
  to: string;
  label: string;
}

/* Enlace con flecha para volver a la sección padre (ej. Gestión o Inventario). */
export function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-(--text) transition-colors hover:text-(--text-h)"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}
