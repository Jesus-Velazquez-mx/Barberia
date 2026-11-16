import { Boxes, Tags } from 'lucide-react';
import { ManagerPageHeader } from '../../components/dashboard/ManagerPageHeaderComponent';
import { ManagementMenu } from '../../components/dashboard/ManagementMenuComponent';
import type { ManagementMenuItem } from '../../components/dashboard/ManagementMenuComponent';

interface StaffInventoryPageProps {
  /* Las rutas de cada CRUD cuelgan del rol: /manager/inventory/... o /receptionist/inventory/... */
  role: 'manager' | 'receptionist';
}

/* Inventario del personal (manager y recepcionista): botones de acceso a los CRUD de insumos y categorías. */
function StaffInventoryPage({ role }: StaffInventoryPageProps) {
  const items: ManagementMenuItem[] = [
    {
      to: `/${role}/inventory/supplies`,
      title: 'Suministros',
      description: 'Consulta y administra los insumos y sus existencias.',
      icon: <Boxes size={24} aria-hidden="true" />
    },
    {
      to: `/${role}/inventory/supply-categories`,
      title: 'Categorías de suministros',
      description: 'Organiza los insumos por categoría.',
      icon: <Tags size={24} aria-hidden="true" />
    }
  ];

  return (
    <>
      <ManagerPageHeader title="Inventario" subtitle="Control de insumos y existencias." />
      <ManagementMenu items={items} ariaLabel="Secciones de inventario" />
    </>
  );
}

export default StaffInventoryPage;
