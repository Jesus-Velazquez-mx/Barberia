import { BackLink } from '../../components/BackLinkComponent';
import { OfferedServicesContainer } from '../../containers/OfferedServicesContainer';

interface StaffOfferedServicesPageProps {
  /* El manager administra (desde Gestión); la recepcionista solo consulta (desde Servicios). */
  role: 'manager' | 'receptionist';
}

function StaffOfferedServicesPage({ role }: StaffOfferedServicesPageProps) {
  const isManager = role === 'manager';

  return (
    <>
      <BackLink
        to={isManager ? '/manager/management' : '/receptionist/services'}
        label={isManager ? 'Volver a Gestión' : 'Volver a Servicios'}
      />
      <OfferedServicesContainer canManage={isManager} />
    </>
  );
}

export default StaffOfferedServicesPage;
