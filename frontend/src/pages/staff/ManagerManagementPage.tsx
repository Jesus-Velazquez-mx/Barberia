import { Clock, Scissors, Store, Tags } from 'lucide-react';
import { ManagerPageHeader } from '../../components/ManagerPageHeaderComponent';
import { ManagementMenu } from '../../components/ManagementMenuComponent';
import type { ManagementMenuItem } from '../../components/ManagementMenuComponent';

const MANAGEMENT_ITEMS: ManagementMenuItem[] = [
  {
    to: '/manager/management/shops',
    title: 'Sucursales',
    description: 'Administra las sucursales de la barbería.',
    icon: <Store size={24} aria-hidden="true" />
  },
  {
    to: '/manager/management/shifts',
    title: 'Turnos',
    description: 'Consulta y ajusta los horarios de los turnos.',
    icon: <Clock size={24} aria-hidden="true" />
  },
  {
    to: '/manager/management/services',
    title: 'Servicios ofrecidos',
    description: 'Administra los servicios, su duración y su precio.',
    icon: <Scissors size={24} aria-hidden="true" />
  },
  {
    to: '/manager/management/service-categories',
    title: 'Categorías de servicios',
    description: 'Organiza los servicios por categoría.',
    icon: <Tags size={24} aria-hidden="true" />
  }
];

function ManagerManagementPage() {
  return (
    <>
      <ManagerPageHeader title="Gestión" subtitle="Configuración general del negocio." />
      <ManagementMenu items={MANAGEMENT_ITEMS} />
    </>
  );
}

export default ManagerManagementPage;
