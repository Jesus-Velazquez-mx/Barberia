import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { InputField } from './InputFieldComponent';
import { Button } from './ButtonComponent';
import { Modal } from './ModalComponent';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  newPasswordRegister: UseFormRegisterReturn;
  confirmNewPasswordRegister: UseFormRegisterReturn;
  currentPasswordError?: FieldError;
  newPasswordError?: FieldError;
  confirmNewPasswordError?: FieldError;
  serverError: string;
  isSubmitting: boolean;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
  newPasswordRegister,
  confirmNewPasswordRegister,
  newPasswordError,
  confirmNewPasswordError,
  serverError,
  isSubmitting
}: ChangePasswordModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="m-0 text-xl font-semibold text-[var(--text-h)]">Cambiar contraseña</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="text-[var(--text)] transition-colors hover:text-[var(--text-h)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <InputField
          id="newPassword"
          type="password"
          label="Nueva contraseña *"
          placeholder="Ingresa tu nueva contraseña"
          error={newPasswordError?.message}
          registerProps={newPasswordRegister}
        />

        <InputField
          id="confirmNewPassword"
          type="password"
          label="Confirmar nueva contraseña *"
          placeholder="Repite la nueva contraseña"
          error={confirmNewPasswordError?.message}
          registerProps={confirmNewPasswordRegister}
        />

        {serverError && (
          <p className="text-center text-[0.85rem] font-semibold text-[#ff4d4d]" role="alert">
            {serverError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            className="!h-12 !border !border-solid !border-[var(--text)] !bg-transparent !px-8 !normal-case !text-[var(--text)]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Actualizando..."
            className="!h-12 !px-8 !normal-case"
          >
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Modal>
  );
}
