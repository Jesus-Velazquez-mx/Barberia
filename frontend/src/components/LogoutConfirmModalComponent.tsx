import { LogOut } from 'lucide-react';
import { Button } from './ButtonComponent';
import { Modal } from './ModalComponent';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="pb-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-(--accent)/40 bg-(--accent)/10">
        <LogOut size={26} className="text-(--accent)" />
      </div>

      <h2 className="mb-3 mt-5 font-sans font-bold tracking-normal text-(--text-h)">¿Cerrar sesión?</h2>
      <p className="text-(--text)">
        Vas a salir de tu cuenta. Tendrás que iniciar sesión de nuevo para volver a acceder.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Button
          type="button"
          onClick={onClose}
          className="h-12! border! border-solid! border-white/10! bg-[#2A2A2A]! normal-case! text-(--text-h)!"
        >
          Cancelar
        </Button>
        <Button type="button" onClick={onConfirm} className="h-12! normal-case!">
          Sí, cerrar sesión
        </Button>
      </div>
    </Modal>
  );
}
