import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { ClientAppointmentDetailContainer } from '../../containers/ClientAppointmentDetailContainer';

/* Se re-exporta para que la lista de citas siga importándolo desde aquí. */
export const CLIENT_APPOINTMENTS_PATH = '/client/appointments';

function ClientAppointmentDetailPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <section>
      <Link
        to={CLIENT_APPOINTMENTS_PATH}
        className="mb-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-(--text) no-underline transition-colors hover:text-(--accent)"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Volver a mis citas
      </Link>

      <h1 className="mb-6 text-3xl text-(--text-h)">Detalle de la cita</h1>
      <ClientAppointmentDetailContainer />
    </section>
  );
}

export default ClientAppointmentDetailPage;