import type { FormEvent, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './ButtonComponent';
import { Modal } from './ModalComponent';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
  description: string;
  submitLabel: string;
  loadingLabel: string;
  serverError: string;
  isSubmitting: boolean;
  /* Los campos del formulario. */
  children: ReactNode;
}

/* Estructura común de los modales de alta/edición: encabezado, campos, error del servidor y botones. */
export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  submitLabel,
  loadingLabel,
  serverError,
  isSubmitting,
  children
}: FormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!max-w-lg">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="m-0 text-xl font-semibold text-(--text-h)">{title}</h2>
          <p className="mt-1 text-[0.9rem] text-(--text)">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="cursor-pointer text-(--text) transition-colors hover:text-(--text-h)"
        >
          <X size={20} />
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        {children}

        {serverError && (
          <p className="text-center text-[0.85rem] font-semibold text-[#ff4d4d]" role="alert">
            {serverError}
          </p>
        )}

        {/* Sticky dentro del scroll del Modal; -mx-8 compensa su px-8 para que la barra llegue a los bordes */}
        <div className="sticky bottom-0 -mx-8 mt-2 flex justify-end gap-3 border-t border-white/10 bg-[#1E1E1E] px-8 pb-6 pt-4">
          <Button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-12! border! border-solid! border-(--text)! bg-transparent! px-8! normal-case! text-(--text)!"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText={loadingLabel}
            className="h-12! px-8! normal-case!"
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
