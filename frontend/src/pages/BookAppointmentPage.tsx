import { BookAppointmentContainer } from '../containers/BookAppointmentContainer';
import { useAuth } from '../context/AuthContext';

interface BookAppointmentPageProps {
  /* Registrar servicio sin cita (solo personal): agenda en el próximo slot de hoy. */
  isWalkIn?: boolean;
}

function BookAppointmentPage({ isWalkIn = false }: BookAppointmentPageProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <section>
      <h1 className="mb-6 text-3xl text-(--text-h)">{isWalkIn ? 'Registrar servicio sin cita' : 'Agendar cita'}</h1>
      <BookAppointmentContainer isWalkIn={isWalkIn} />
    </section>
  );
}

export default BookAppointmentPage;
