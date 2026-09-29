import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EditUserModalContainer } from '../containers/EditUserModalContainer';
import { ChangePasswordModalContainer } from '../containers/ChangePasswordModalContainer';
import { DeleteAccountModalContainer } from '../containers/DeleteAccountModalContainer';
import { DashboardSidebar } from '../components/DashboardSidebarComponent';
import { UserProfile } from '../components/UserProfileComponent';
import type { User } from '../types/auth';
import { useAuth } from '../context/AuthContext';

function EditUserPage() {
  const { user: authUser, login: loginContext, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!authUser) return null;

  const handleUpdated = (updatedUser: User) => {
    // Mantiene sincronizado el AuthContext con los datos que acaban de guardarse
    if (token) loginContext({ user: updatedUser, token });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar firstName={authUser.firstName} />

      <main className="flex-1 px-12 py-10">
        <Link
          to="/client/home"
          className="mb-6 inline-flex items-center gap-2 text-lg font-semibold text-[var(--text)] no-underline transition-colors hover:text-[var(--accent)]"
        >
          <span aria-hidden="true">←</span> Volver
        </Link>

        <UserProfile
          user={authUser}
          onEdit={() => setIsModalOpen(true)}
          onChangePassword={() => setIsPasswordModalOpen(true)}
          onDeleteAccount={() => setIsDeleteModalOpen(true)}
          onLogout={handleLogout}
        />
      </main>

      <EditUserModalContainer
        user={authUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdated={handleUpdated}
      />
      <ChangePasswordModalContainer isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <DeleteAccountModalContainer isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
    </div>
  );
}

export default EditUserPage;
