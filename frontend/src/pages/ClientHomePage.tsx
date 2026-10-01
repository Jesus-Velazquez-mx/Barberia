import { DashboardSidebar } from '../components/DashboardSidebarComponent';
import { useAuth } from '../context/AuthContext';

function ClientHomePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar firstName={user.firstName} />

      <main className="flex-1 px-12 py-10" />
    </div>
  );
}

export default ClientHomePage;
