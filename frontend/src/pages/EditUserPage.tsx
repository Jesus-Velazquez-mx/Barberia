import { useState } from 'react';
import { EditUserModalContainer } from '../containers/EditUserModalContainer';
import { ChangePasswordModalContainer } from '../containers/ChangePasswordModalContainer';
import { Button } from '../components/ButtonComponent';
import type { User } from '../types/auth';
import { useAuth } from '../context/AuthContext';

function EditUserPage() {
  const { user: authUser, login: loginContext, token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  if (!authUser) return null;

  const handleUpdated = (updatedUser: User) => {
    // Mantiene sincronizado el AuthContext con los datos que acaban de guardarse
    if (token) loginContext({ user: updatedUser, token });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-10">
      <section className="box-border flex w-full max-w-[25rem] flex-col items-center gap-5 rounded-2xl border border-[#2c2c2c] bg-[#1E1E1E] px-[33px] py-8">
        <h2 className="m-0 text-[29px] font-semibold uppercase text-[var(--text-h)]">Perfil de usuario</h2>
        <p className="m-0 text-lg font-semibold text-[var(--text)]">
          Nombre: {authUser.firstName} {authUser.lastName}
        </p>
        <p className="m-0 text-lg font-semibold text-[var(--text)]">Correo: {authUser.email}</p>

        <Button type="button" onClick={() => setIsModalOpen(true)} className="!h-12 !px-8 !normal-case">
          Editar usuario
        </Button>
        <Button type="button" onClick={() => setIsPasswordModalOpen(true)} className="!h-12 !px-8 !normal-case">
          Cambiar contraseña
        </Button>
      </section>

      <EditUserModalContainer
        user={authUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdated={handleUpdated}
      />
      <ChangePasswordModalContainer isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}

export default EditUserPage;
