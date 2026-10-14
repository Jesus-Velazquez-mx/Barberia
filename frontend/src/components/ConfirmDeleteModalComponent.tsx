import type { ReactNode } from 'react';
import { Button } from './ButtonComponent';
import { Modal } from './ModalComponent';
import dangerIcon from '../assets/icons/peligro.svg';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  serverError: string;
  isSubmitting: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  serverError,
  isSubmitting
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!max-w-md !border-red-500/60 pb-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
        <img src={dangerIcon} alt="" className="h-7 w-7" />
      </div>

      <h2 className="mt-5 mb-3 font-sans font-bold tracking-normal text-[var(--text-h)]">{title}</h2>
      <p className="text-[var(--text)]">{description}</p>

      {serverError && (
        <p className="mt-4 text-center text-[0.85rem] font-semibold text-[#ff4d4d]" role="alert">
          {serverError}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="!h-12 !border !border-solid !border-white/10 !bg-[#2A2A2A] !normal-case !text-[var(--text-h)]"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          isLoading={isSubmitting}
          loadingText="Eliminando..."
          className="!h-12 !bg-red-600 !normal-case !text-white"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
