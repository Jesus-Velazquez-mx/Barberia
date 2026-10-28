import { BackLink } from '../../components/BackLinkComponent';
import { ServiceCategoriesContainer } from '../../containers/ServiceCategoriesContainer';

interface StaffServiceCategoriesPageProps {
  /* El manager administra (desde Gestión); la recepcionista solo consulta (desde Servicios). */
  role: 'manager' | 'receptionist';
}

function StaffServiceCategoriesPage({ role }: StaffServiceCategoriesPageProps) {
  const isManager = role === 'manager';

  return (
    <>
      <BackLink
        to={isManager ? '/manager/management' : '/receptionist/services'}
        label={isManager ? 'Volver a Gestión' : 'Volver a Servicios'}
      />
      <ServiceCategoriesContainer canManage={isManager} />
    </>
  );
}

export default StaffServiceCategoriesPage;
