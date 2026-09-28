import { useState } from 'react';
import { EditUserModalContainer } from '../containers/EditUserModalContainer';
import { ChangePasswordModalContainer } from '../containers/ChangePasswordModalContainer';
import { DeleteAccountModalContainer } from '../containers/DeleteAccountModalContainer';
import { DashboardSidebar } from '../components/DashboardSidebarComponent';
import { UserProfile } from '../components/UserProfileComponent';
import type { User } from '../types/auth';
import { useAuth } from '../context/AuthContext';

function EditUserPage() {
  const { user: authUser, login: loginContext, token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!authUser) return null;

  const handleUpdated = (updatedUser: User) => {
    // Mantiene sincronizado el AuthContext con los datos que acaban de guardarse
    if (token) loginContext({ user: updatedUser, token });
  };

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar firstName={authUser.firstName} />

      <main className="flex-1 px-12 py-10">
        <UserProfile
          user={authUser}
          onEdit={() => setIsModalOpen(true)}
          onChangePassword={() => setIsPasswordModalOpen(true)}
          onDeleteAccount={() => setIsDeleteModalOpen(true)}
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
