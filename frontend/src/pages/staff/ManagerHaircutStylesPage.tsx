import { BackLink } from '../../components/common/BackLinkComponent';
import { HaircutStylesContainer } from '../../containers/HaircutStylesContainer';

/* Catálogo de estilos de corte (solo manager, desde Gestión). */
function ManagerHaircutStylesPage() {
  return (
    <>
      <BackLink to="/manager/management" label="Volver a Gestión" />
      <HaircutStylesContainer />
    </>
  );
}

export default ManagerHaircutStylesPage;
