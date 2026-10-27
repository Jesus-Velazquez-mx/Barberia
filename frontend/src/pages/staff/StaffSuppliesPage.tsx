import { BackLink } from '../../components/BackLinkComponent';
import { StaffSuppliesContainer } from '../../containers/StaffSuppliesContainer';

interface StaffSuppliesPageProps {
  /* Define a qué Inventario regresa el enlace: /manager/inventory o /receptionist/inventory. */
  role: 'manager' | 'receptionist';
}

function StaffSuppliesPage({ role }: StaffSuppliesPageProps) {
  return (
    <>
      <BackLink to={`/${role}/inventory`} label="Volver a Inventario" />
      <StaffSuppliesContainer />
    </>
  );
}

export default StaffSuppliesPage;
