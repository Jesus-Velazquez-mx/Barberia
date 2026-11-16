import { Scissors, Tags } from 'lucide-react';
import { ManagerPageHeader } from '../../components/dashboard/ManagerPageHeaderComponent';
import { ManagementMenu } from '../../components/dashboard/ManagementMenuComponent';
import type { ManagementMenuItem } from '../../components/dashboard/ManagementMenuComponent';

const SERVICES_ITEMS: ManagementMenuItem[] = [
  {
    to: '/receptionist/services/offered',
    title: 'Servicios ofrecidos',
    description: 'Consulta los servicios, su duración y su precio.',
    icon: <Scissors size={24} aria-hidden="true" />
  },
  {
    to: '/receptionist/services/categories',
    title: 'Categorías de servicios',
    description: 'Consulta cómo se organizan los servicios.',
    icon: <Tags size={24} aria-hidden="true" />
  }
];

/* Catálogo de servicios de la recepcionista (solo consulta; la administración vive en Gestión del manager). */
function ReceptionistServicesPage() {
  return (
    <>
      <ManagerPageHeader title="Servicios" subtitle="Catálogo de servicios de la barbería." />
      <ManagementMenu items={SERVICES_ITEMS} ariaLabel="Secciones de servicios" />
    </>
  );
}

export default ReceptionistServicesPage;
