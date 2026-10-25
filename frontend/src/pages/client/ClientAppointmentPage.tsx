import {ClientAppointmentsContainer} from '../../containers/ClientAppointmentsContainer';
import { useAuth } from '../../context/AuthContext';

function ClientAppointmentsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <section>
      <h1 className="mb-1 text-3xl text-(--text-h)">Mis citas</h1>
      <p className="mb-6 text-(--text)">Consulta tus citas próximas, pasadas y canceladas.</p>
      <ClientAppointmentsContainer />
    </section>
  );
}

export default ClientAppointmentsPage;