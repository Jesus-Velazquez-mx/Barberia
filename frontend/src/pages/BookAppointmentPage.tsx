import { BookAppointmentContainer } from '../containers/BookAppointmentContainer';
import { useAuth } from '../context/AuthContext';

function BookAppointmentPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <section>
      <h1 className="mb-6 text-3xl text-(--text-h)">Agendar cita</h1>
      <BookAppointmentContainer />
    </section>
  );
}

export default BookAppointmentPage;
