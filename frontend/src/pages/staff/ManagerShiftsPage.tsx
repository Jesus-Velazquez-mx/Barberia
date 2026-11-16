import { BackLink } from '../../components/common/BackLinkComponent';
import { ManagerShiftsContainer } from '../../containers/ManagerShiftsContainer';

function ManagerShiftsPage() {
  return (
    <>
    <BackLink to="/manager/management" label="Volver a Gestión" />
    <ManagerShiftsContainer />
    </>
  )
}

export default ManagerShiftsPage;
