import type { UseFormRegisterReturn } from 'react-hook-form';
import { Button } from './ButtonComponent';
import { Modal } from './ModalComponent';
import dangerIcon from '../assets/icons/peligro.svg';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  confirmationRegister: UseFormRegisterReturn;
  confirmationWord: string;
  isConfirmed: boolean;
  serverError: string;
  isSubmitting: boolean;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onSubmit,
  confirmationRegister,
  confirmationWord,
  isConfirmed,
  serverError,
  isSubmitting,
}: DeleteAccountModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!border-red-500/60 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
        <img src={dangerIcon} alt="" className="h-7 w-7" />
      </div>

      <h2 className="mt-5 mb-3 font-sans font-bold tracking-normal text-[var(--text-h)]">
        ¿Eliminar cuenta permanentemente?
      </h2>
      <p className="text-[var(--text)]">
        Esta acción no se puede deshacer.
        <br />
        Se eliminarán tus datos de acceso, historial de servicios agendados y puntos acumulados.
      </p>

      <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <label htmlFor="deleteConfirmation" className="text-[var(--text)]">
          Para confirmar, escribe &quot;{confirmationWord}&quot; abajo:
        </label>
        <input
          id="deleteConfirmation"
          type="text"
          autoComplete="off"
          placeholder={confirmationWord}
          className="w-full rounded-lg border pr-4 border-[#333333] bg-[#121212] text-center text-white placeholder:text-[#6b6b6b] focus:border-red-500 focus:outline-none"
          {...confirmationRegister}
        />

        {serverError && (
          <p className="text-center text-[0.85rem] font-semibold text-[#ff4d4d]" role="alert">
            {serverError}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            onClick={onClose}
            className="!h-12 !border !border-solid !border-white/10 !bg-[#2A2A2A] !normal-case !text-[var(--text-h)]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isConfirmed}
            isLoading={isSubmitting}
            loadingText="Eliminando..."
            className="!h-12 !bg-red-600 !normal-case !text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sí, eliminar cuenta
          </Button>
        </div>
      </form>
    </Modal>
  );
}
