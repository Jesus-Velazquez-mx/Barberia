import { BackLink } from '../../components/BackLinkComponent';
import { StaffSupplyCategoriesContainer } from '../../containers/StaffSupplyCategoriesContainer';

interface StaffSupplyCategoriesPageProps {
  /* Define a qué Inventario regresa el enlace: /manager/inventory o /receptionist/inventory. */
  role: 'manager' | 'receptionist';
}

function StaffSupplyCategoriesPage({ role }: StaffSupplyCategoriesPageProps) {
  return (
    <>
      <BackLink to={`/${role}/inventory`} label="Volver a Inventario" />
      <StaffSupplyCategoriesContainer />
    </>
  );
}

export default StaffSupplyCategoriesPage;
