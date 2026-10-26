import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ManagerPageHeader } from '../../components/ManagerPageHeaderComponent';

interface ManagerSectionPlaceholderPageProps {
  title: string;
  subtitle: string;
  /* Lo que contendrá la sección, para dejar claro qué falta. */
  plannedItems?: string[];
  /* Si se pasa, muestra un enlace para volver a la sección padre (ej. Gestión). */
  backTo?: { to: string; label: string };
}

/* Página base de una sección del manager que aún no se implementa. Se reemplaza por la vista real. */
function ManagerSectionPlaceholderPage({ title, subtitle, plannedItems, backTo }: ManagerSectionPlaceholderPageProps) {
  return (
    <>
      {backTo ? (
        <Link
          to={backTo.to}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-(--text) transition-colors hover:text-(--text-h)"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {backTo.label}
        </Link>
      ) : null}

      <ManagerPageHeader title={title} subtitle={subtitle} />

      <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-[#1A1A1A] px-6 py-14 text-center">
        <p className="text-base font-semibold text-(--text-h)">Esta sección estará disponible próximamente.</p>
        {plannedItems ? <p className="mt-2 text-sm text-(--text)">Incluirá: {plannedItems.join(', ')}.</p> : null}
      </div>
    </>
  );
}

export default ManagerSectionPlaceholderPage;
