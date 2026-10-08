import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { deleteUser } from '../services/userService';
import { ApiError } from '../types/api';
import type { DeleteAccountFormValues } from '../types/auth';
import { DeleteAccountModal } from '../components/DeleteAccountModalComponent';
import { useAuth } from '../context/AuthContext';

const CONFIRMATION_WORD = 'ELIMINAR';

interface DeleteAccountModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModalContainer({ isOpen, onClose }: DeleteAccountModalContainerProps) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting }
  } = useForm<DeleteAccountFormValues>({
    defaultValues: { confirmation: '' }
  });

  const isConfirmed = watch('confirmation') === CONFIRMATION_WORD;

  const handleClose = () => {
    reset();
    setServerError('');
    onClose();
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setServerError('');
    void handleSubmit(onSubmit)(event);
  };

  const onSubmit = async () => {
    setServerError('');

    if (!user || !token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    try {
      await deleteUser(user.id, token);
      logout();
      navigate('/');
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : 'No se pudo eliminar la cuenta. Intenta de nuevo.';
      setServerError(errorMessage);
    }
  };

  return (
    <DeleteAccountModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleFormSubmit}
      confirmationRegister={register('confirmation', {
        validate: (value) => value === CONFIRMATION_WORD
      })}
      confirmationWord={CONFIRMATION_WORD}
      isConfirmed={isConfirmed}
      serverError={serverError}
      isSubmitting={isSubmitting}
    />
  );
}
