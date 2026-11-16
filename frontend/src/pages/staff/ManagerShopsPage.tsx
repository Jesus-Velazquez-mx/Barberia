
import { ManagerShopsContainer } from '../../containers/ManagerShopsContainer';
import { BackLink } from '../../components/common/BackLinkComponent';
function ManagerShopsPage() {
  return (
      <>
      <BackLink to="/manager/management" label="Volver a Gestión" />
      <ManagerShopsContainer />
      </>
    )
}

export default ManagerShopsPage;
