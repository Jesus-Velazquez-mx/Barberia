import { useForm } from 'react-hook-form';
import type { DeleteAccountFormValues } from '../types/auth';
import { DeleteAccountModal } from '../components/DeleteAccountModalComponent';

const CONFIRMATION_WORD = 'ELIMINAR';

interface DeleteAccountModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModalContainer({ isOpen, onClose }: DeleteAccountModalContainerProps) {
  const { register, handleSubmit, watch, reset } = useForm<DeleteAccountFormValues>({
    defaultValues: { confirmation: '' },
  });

  const isConfirmed = watch('confirmation') === CONFIRMATION_WORD;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  const onSubmit = () => {
    // Pendiente: llamar a DELETE /api/users/:id, cerrar sesión y redirigir al inicio
    handleClose();
  };

  return (
    <DeleteAccountModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleFormSubmit}
      confirmationRegister={register('confirmation', {
        validate: (value) => value === CONFIRMATION_WORD,
      })}
      confirmationWord={CONFIRMATION_WORD}
      isConfirmed={isConfirmed}
    />
  );
}
