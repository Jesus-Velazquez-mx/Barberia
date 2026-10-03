import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { changePassword } from '../services/userService';
import { ApiError } from '../types/api';
import type { ChangePasswordFormValues } from '../types/auth';
import { ChangePasswordModal } from '../components/ChangePasswordModalComponent';
import { Toast } from '../components/ToastComponent';
import { useAuth } from '../context/AuthContext';

const REQUIRED_MESSAGE = 'Debe capturar su contraseña actual, la nueva contraseña y su confirmación.';
const POLICY_MESSAGE = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.';
/* RN-03: mínimo 8 caracteres, al menos una mayúscula y un número */
const PASSWORD_POLICY_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

interface ChangePasswordModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModalContainer({ isOpen, onClose }: ChangePasswordModalContainerProps) {
  const { user, token } = useAuth();
  const [serverError, setServerError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>();

  const handleClose = () => {
    reset();
    setServerError('');
    onClose();
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setServerError('');
    void handleSubmit(onSubmit)(event);
  };

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setServerError('');

    if (!user || !token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    try {
      await changePassword(user.id, { newPassword: values.newPassword }, token);
      reset();
      // El modal ya cumplió su propósito: se cierra y el aviso vive como toast flotante.
      onClose();
      setToastMessage('Contraseña actualizada correctamente.');
    } catch (error) {
      let errorMessage = 'Ocurrió un error al actualizar la contraseña. Intente nuevamente.';

      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 400) {
          errorMessage = error.message || errorMessage;
        }
      }

      setServerError(errorMessage);
    }
  };

  return (
    <>
      <ChangePasswordModal
        isOpen={isOpen}
        onClose={handleClose}
        onSubmit={handleFormSubmit}
        newPasswordRegister={register('newPassword', {
          required: REQUIRED_MESSAGE,
          pattern: { value: PASSWORD_POLICY_REGEX, message: POLICY_MESSAGE },
        })}
        confirmNewPasswordRegister={register('confirmNewPassword', {
          required: REQUIRED_MESSAGE,
          validate: (value) => value === watch('newPassword') || 'La confirmación no coincide con la nueva contraseña.',
        })}
        newPasswordError={errors.newPassword}
        confirmNewPasswordError={errors.confirmNewPassword}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <Toast message={toastMessage} type="success" onDismiss={() => setToastMessage(null)} />
    </>
  );
}
