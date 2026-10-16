import { ManagerPageHeader } from '../components/ManagerPageHeaderComponent';

interface ManagerSectionPlaceholderPageProps {
  title: string;
  subtitle: string;
  /* Lo que contendrá la sección, para dejar claro qué falta. */
  plannedItems?: string[];
}

/* Página base de una sección del manager que aún no se implementa. Se reemplaza por la vista real. */
function ManagerSectionPlaceholderPage({ title, subtitle, plannedItems }: ManagerSectionPlaceholderPageProps) {
  return (
    <>
      <ManagerPageHeader title={title} subtitle={subtitle} />

      <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-[#1A1A1A] px-6 py-14 text-center">
        <p className="text-base font-semibold text-(--text-h)">Esta sección estará disponible próximamente.</p>
        {plannedItems ? <p className="mt-2 text-sm text-(--text)">Incluirá: {plannedItems.join(', ')}.</p> : null}
      </div>
    </>
  );
}

export default ManagerSectionPlaceholderPage;
