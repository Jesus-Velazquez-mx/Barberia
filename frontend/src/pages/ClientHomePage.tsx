import { Link } from 'react-router-dom';
import { DashboardSidebar } from '../components/DashboardSidebarComponent';
import { useAuth } from '../context/AuthContext';

function ClientHomePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar firstName={user.firstName} />

      <main className="flex-1 px-4 pt-20 sm:px-12 lg:py-10">
        {/* Temporal: apunta a la UI de reserva con datos mock */}
        <Link
          to="/client/booking-scratch"
          className="inline-block rounded-lg bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-[#141414] no-underline transition-all duration-200 hover:bg-[#B8924A] hover:no-underline hover:shadow-[0_0_18px_rgba(210,172,102,0.6)]"
        >
          Selector Citas Mock
        </Link>
      </main>
    </div>
  );
}

export default ClientHomePage;
