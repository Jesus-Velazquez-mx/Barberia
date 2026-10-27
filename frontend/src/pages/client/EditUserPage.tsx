import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditUserModalContainer } from '../../containers/EditUserModalContainer';
import { ChangePasswordModalContainer } from '../../containers/ChangePasswordModalContainer';
import { DeleteAccountModalContainer } from '../../containers/DeleteAccountModalContainer';
import { LogoutConfirmModal } from '../../components/LogoutConfirmModalComponent';
import { UserProfile } from '../../components/UserProfileComponent';
import type { User } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';

function EditUserPage() {
  const { user: authUser, login: loginContext, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (!authUser) return null;

  const handleUpdated = (updatedUser: User) => {
    // Mantiene sincronizado el AuthContext con los datos que acaban de guardarse
    if (token) loginContext({ user: updatedUser, token });
  };

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-full w-full max-w-300">
      <UserProfile
        user={authUser}
        onEdit={() => setIsModalOpen(true)}
        onChangePassword={() => setIsPasswordModalOpen(true)}
        onDeleteAccount={() => setIsDeleteModalOpen(true)}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      <EditUserModalContainer
        user={authUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdated={handleUpdated}
      />
      <ChangePasswordModalContainer isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <DeleteAccountModalContainer isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}

export default EditUserPage;
