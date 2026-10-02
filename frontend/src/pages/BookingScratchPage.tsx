import { DashboardSidebar } from '../components/DashboardSidebarComponent';
import { BookingScratchContainer } from '../components/BookingScratchContainer';
import { useAuth } from '../context/AuthContext';

// Página temporal: se reemplaza en la tarea
// "Crear contenedor, página y ruta del flujo de reserva".
function BookingScratchPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar firstName={user.firstName} />

      <main className="flex-1 px-4 pt-20 sm:px-12 lg:py-10">
        <h1 className="mb-6 text-3xl text-[var(--text-h)]">Reservar cita</h1>
        <BookingScratchContainer />
      </main>
    </div>
  );
}

export default BookingScratchPage;
